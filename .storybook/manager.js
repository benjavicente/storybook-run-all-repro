import { addons } from 'storybook/manager-api';

// Read-only diagnostics. The event name is internal and pinned to Storybook 10.6.5.
addons.register('run-all-repro/diagnostics', () => {
  const requests = [];
  addons.getChannel().on('UNIVERSAL_STORE:storybook/test', ({ event, eventInfo }) => {
    if (event.type !== 'TRIGGER_RUN' || event.payload?.triggeredBy !== 'run-all') return;
    const request = {
      actorId: eventInfo.actor.id,
      environment: eventInfo.actor.environment,
      receivedAt: Date.now(),
    };
    requests.push(request);
    console.info('[run-all-repro]', request);
  });
  globalThis.__runAllRepro = {
    reset() { requests.length = 0; },
    summary() {
      return {
        receivedMessages: requests.length,
        managerOrigins: [...new Set(requests.filter(r => r.environment === 'MANAGER').map(r => r.actorId))],
      };
    },
  };
});
