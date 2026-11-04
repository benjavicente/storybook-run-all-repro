import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { createTestProviderStore as upstreamFactory } from '../vendor/create-test-provider-store.v10.6.5.mjs';

// Run the same upstream factory with only the proposed onRunAll wrapper changed.
const source = readFileSync(new URL('../vendor/create-test-provider-store.v10.6.5.mjs', import.meta.url), 'utf8');
const original = "onRunAll: (listener) => universalTestProviderStore.subscribe('run-all', listener),";
const replacement = `onRunAll: (listener) => universalTestProviderStore.subscribe('run-all', (_event, info) => {
    if (info.actor.environment === 'MANAGER' &&
        universalTestProviderStore.actor.environment === 'MANAGER' &&
        info.actor.id !== universalTestProviderStore.actor.id) return;
    listener();
  }),`;
assert.equal(source.split(original).length, 2, 'the expected upstream callback must occur exactly once');
const candidateModule = await import('data:text/javascript;base64,' + Buffer.from(source.replace(original, replacement)).toString('base64'));

// A synchronous model of delivery to stores, retaining the originating actor.
// This deliberately does not claim to exercise UniversalStore or a real socket.
function modelTransport() {
  const stores = [];
  return (id, environment) => {
    const listeners = new Map();
    let state = {};
    const store = {
      actor: { id, environment, type: environment === 'SERVER' ? 'LEADER' : 'FOLLOWER' },
      untilReady: async () => {},
      getState: () => state,
      setState: value => { state = typeof value === 'function' ? value(state) : value; },
      subscribe(type, listener) {
        if (!listeners.has(type)) listeners.set(type, new Set());
        listeners.get(type).add(listener);
        return () => listeners.get(type).delete(listener);
      },
      send(event) {
        for (const receiver of stores) {
          for (const listener of receiver.listeners.get(event.type) ?? []) {
            listener(event, {
              actor: store.actor,
              ...(receiver !== store ? { forwardingActor: { id: 'server', environment: 'SERVER', type: 'LEADER' } } : {}),
            });
          }
        }
      },
      listeners,
    };
    stores.push(store);
    return store;
  };
}

function setup(factory) {
  const createStore = modelTransport();
  const actors = { a: 'MANAGER', b: 'MANAGER', server: 'SERVER', preview: 'PREVIEW' };
  const bundles = Object.fromEntries(Object.entries(actors).map(([id, environment]) => [id, factory({ universalTestProviderStore: createStore(id, environment) })]));
  const calls = { a: 0, b: 0, server: 0, preview: 0 };
  const unsubscribe = {};
  for (const [id, bundle] of Object.entries(bundles)) {
    unsubscribe[id] = bundle.getTestProviderStoreById('example-provider').onRunAll(() => { calls[id]++; });
  }
  return { bundles, calls, unsubscribe };
}

test('unmodified upstream: one manager-origin action calls both managers', async () => {
  const { bundles, calls } = setup(upstreamFactory);
  await bundles.a.fullTestProviderStore.runAll();
  assert.deepEqual(calls, { a: 1, b: 1, server: 1, preview: 1 });
});

test('candidate: only the originating manager calls its providers', async () => {
  const { bundles, calls } = setup(candidateModule.createTestProviderStore);
  await bundles.a.fullTestProviderStore.runAll();
  assert.deepEqual(calls, { a: 1, b: 0, server: 1, preview: 1 });
});

test('candidate: either manager can originate the action', async () => {
  const { bundles, calls } = setup(candidateModule.createTestProviderStore);
  await bundles.b.fullTestProviderStore.runAll();
  assert.deepEqual(calls, { a: 0, b: 1, server: 1, preview: 1 });
});

test('candidate: server-origin actions retain broadcast callback behavior', async () => {
  const { bundles, calls } = setup(candidateModule.createTestProviderStore);
  await bundles.server.fullTestProviderStore.runAll();
  assert.deepEqual(calls, { a: 1, b: 1, server: 1, preview: 1 });
});

test('candidate: preview-origin actions retain broadcast callback behavior', async () => {
  const { bundles, calls } = setup(candidateModule.createTestProviderStore);
  await bundles.preview.fullTestProviderStore.runAll();
  assert.deepEqual(calls, { a: 1, b: 1, server: 1, preview: 1 });
});

test('candidate: unsubscribe still removes the wrapped listener', async () => {
  const { bundles, calls, unsubscribe } = setup(candidateModule.createTestProviderStore);
  unsubscribe.b();
  await bundles.server.fullTestProviderStore.runAll();
  assert.deepEqual(calls, { a: 1, b: 0, server: 1, preview: 1 });
});

test('candidate: all providers in the originating manager still receive the action', async () => {
  const { bundles, calls } = setup(candidateModule.createTestProviderStore);
  let extraProviderCalls = 0;
  bundles.a.getTestProviderStoreById('another-provider').onRunAll(() => { extraProviderCalls++; });
  await bundles.a.fullTestProviderStore.runAll();
  assert.deepEqual(calls, { a: 1, b: 0, server: 1, preview: 1 });
  assert.equal(extraProviderCalls, 1);
});
