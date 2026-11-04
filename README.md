# Storybook Run All with two manager tabs

A small HTML/Vite Storybook app and a focused test of test-provider callback ownership.
One manager-originated `run-all` event currently invokes the callbacks registered by
both manager tabs. The Vitest addon turns each callback into its own `TRIGGER_RUN`.

## Verified here

Validated on 2026-11-04 with a clean install and committed pnpm lockfile:

- Seven actual-factory protocol tests pass, including the candidate guard.
- Static build passes; both CLI browser story tests pass.
- Chrome MCP confirms two distinct requesting manager origins from one global
  **Run tests** click with two tabs open, whether A or B initiates it.
- One-tab controls before and after closing B each show one manager origin.
- Watch mode was off. The runner was warmed with a successful one-tab global run.

See `evidence/browser.json`, `evidence/validation.json`, and sanitized logs.
The candidate has only been checked with modeled transport in the focused tests;
it has not been applied to the installed packages or verified in the browser.
Stop/cancellation and duplicate completed executions are not established here.

## Focused test, without installing anything

```bash
node --test test/protocol.test.mjs
```

The baseline asserts that both manager callbacks fire. The candidate asserts that
only the originating manager fires, while server/preview origins, server receivers,
multiple providers, and unsubscription retain their existing behavior.
The candidate is applied only to the fixture in memory; it does not patch packages.

## Standalone app

Requires Node 22.12 or newer and a supported Playwright Chromium installation.
Run:

```bash
pnpm install
pnpm exec playwright install chromium
pnpm storybook
```

The workspace allowlist permits esbuild postinstall scripts, required by pnpm 12.
The frozen-lockfile installation was also verified.
If Chromium is already installed for Playwright 1.60.0, skip the browser install.
The app opens at `http://localhost:6006`; automatic tab opening is disabled.
`pnpm build-storybook` checks the static build. `pnpm test:stories` is an optional
CLI control for the two stories, not a reproduction of a multi-manager UI action.

## Exact two-tab check

1. Open `http://localhost:6006/?path=/story/reproduction-counter--first` in tab A.
2. Keep Watch off. Run the global tests with only A open and wait for both stories
   to pass (the warmup used in this validation). This
   initializes the runner before the global action and avoids a cold-start race.
3. Open the same URL in tab B. Wait until both managers and the testing widget are
   ready. Keep both tabs open; do not edit files during the check.
4. In each manager tab's developer console, run `__runAllRepro.reset()`.
5. Click the **global Run tests / Run All button** in the testing widget once in A.
   Do not click a story-specific or individual-provider Run button.
6. In either manager console, run `__runAllRepro.summary()`.
7. Expected: one distinct manager origin. Observed with this fixture: two distinct
   manager origins from the one action. Attach the actual result rather than
   assuming the suspected outcome. The diagnostics log only `TRIGGER_RUN` events
   whose `triggeredBy` is `run-all`.
8. Close B, reset the diagnostics, and repeat from A as a one-tab control. Then
   repeat with both tabs open and B originating the action.

Use the number of **distinct manager origins**, not raw received-message count:
transport forwarding can deliver multiple copies of the same origin. An empty
summary means the global `run-all` path was not observed and is not a passing
result. Save the console summary and the terminal log with the exact button used.

## Scope and proposed correction

`candidate/on-run-all.patch` skips a callback only when both origin and receiver
are `MANAGER` and their provider-store actor IDs differ. Server-originated actions
and server/preview receivers keep their existing broadcast behavior. Comparing
actor IDs alone would incorrectly change those cross-environment cases.

The actor belongs to the **test-provider store**. A separate addon test store has
a different actor ID and must not be used for this comparison. Focus/visibility
and leader/follower status are also not ownership checks.

This issue can create overlapping run requests. It does not establish that every
slow or stuck Stop action has this cause. In particular, this focused test does
not execute browser cancellation or a Vitest run queue. Record cancellation and
recovery separately if including them in a report.

## Upstream and reporting

Checked 2026-11-04: the relevant source is unchanged in 10.6.5, 11.0.0-beta.0,
and the pinned `next` commit listed in `vendor/SOURCE.json`. No fixed upstream
release is claimed. `REPORTING.md` contains the issue-template mapping and a draft.

## Cleanup

Stop the app with Ctrl-C and close both tabs. Generated `node_modules/`,
`storybook-static/`, and `.vite/` are disposable and ignored. Do not include local
dependency symlinks, absolute paths, raw environment dumps, or unrelated logs in
an upload. Generated output is excluded from Git.
