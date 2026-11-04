🤖 ### Describe the bug

With two tabs open to the same Storybook instance, clicking the global **Run tests**
button once runs the Vitest story tests twice. With only one tab open, the same
button runs them once. Watch mode is off.

In the minimal reproduction, each run contains two passing counter tests. A single
click with two manager tabs open produces two complete Vitest result summaries in
the terminal. Clicking from either tab reproduces it; closing the second tab
restores a single run.

Expected: one global click should start one test run, regardless of how many
manager tabs are open.

### Reproduction link

https://github.com/benjavicente/storybook-run-all-repro

### Reproduction steps

1. Clone the reproduction, then run:

   ```sh
   pnpm install
   pnpm exec playwright install chromium
   pnpm storybook
   ```

2. Open `http://localhost:6006/?path=/story/reproduction-counter--first` in tab A.
3. Keep Watch mode off. Click the global **Run tests** button in the sidebar's
   **Component tests** region once and wait for completion to warm up the runner.
4. Open the same URL in tab B and wait until it is ready. Do not edit files.
5. Click the global **Run tests** button once in A and wait for completion.
6. Look at the terminal running Storybook. That click produces two new result
   summaries, each reporting `Test Files 1 passed (1)` and `Tests 2 passed (2)`.
7. Close B, then click the same button once in A. Only one new summary appears.

No browser DevTools are needed for this check. The reproduction also includes
optional manager-origin diagnostics to distinguish separate requests from repeated
transport delivery.

### System

```text
OS: macOS 27.2, arm64 Apple M1
Node: 26.13.0
pnpm: 12.4.1
Manager browser: Chrome 156.0.0.0
storybook: 10.6.5
@storybook/html-vite: 10.6.5
@storybook/addon-vitest: 10.6.5
vitest / @vitest/browser-playwright: 4.1.12
playwright: 1.60.0
vite: 6.4.2
```

The repository includes the verified lockfile and sanitized installed-version
output in `evidence/system.txt`. This output was collected using the installed
Storybook CLI, rather than `storybook@latest`.

### Additional context

The apparent cause is callback ownership: the core test-provider store subscribes
`onRunAll` directly to the synchronized `run-all` event. Both manager tabs receive
that event, and each Vitest addon callback sends its own `TRIGGER_RUN` request.
Manager-origin diagnostics confirmed two distinct requesting actor IDs from one
click; the one-tab controls confirmed one actor ID.

Source references:

- [Provider-store subscription](https://github.com/storybookjs/storybook/blob/v10.6.5/code/core/src/shared/test-provider-store/index.ts#L405)
- [Vitest manager callback](https://github.com/storybookjs/storybook/blob/v10.6.5/code/addons/vitest/src/manager.tsx#L37)

Evidence is in `evidence/browser.json` and `evidence/browser-server.log`. The
terminal log contains two completed runs at 09:35:39 for the click from A and two
at 09:36:11–09:36:12 for the click from B. One-tab controls show single runs at
09:35:11 and 09:37:35.

The repository includes a candidate guard and seven focused actual-factory tests
with modeled transport. The candidate prevents a manager-originated action from
invoking peer-manager callbacks while preserving server/preview behavior. An equivalent guard was verified in temporarily patched 10.6.5 manager bundles:
either initiating tab produces one request origin and one completed run. This
was not a full build of upstream `next`. Stop/cancellation is outside this report.

Related report: [#30883](https://github.com/storybookjs/storybook/issues/30883)
reported doubled UI test counts in a Storybook 9 canary and was closed as fixed.
It does not document a multi-tab trigger or identify the fix, so it is unclear
whether this shares its cause. This reproduction demonstrates two separate
completed runs on 10.6.5, controlled by whether a second manager tab is open.

AI assistance: Codex helped prepare the reproduction, validation, and this draft.
