🤖 ### Describe the bug

The test-provider store subscribes every manager's `onRunAll` listener directly
to the synchronized `run-all` event. With two manager instances, one
manager-originated action invokes both callbacks. The Vitest addon sends a
separate `TRIGGER_RUN` from each callback.

A dependency-free test in the reproduction runs the actual Storybook 10.6.5
provider-store factory against modeled transport metadata. It demonstrates two
manager callbacks from one action. A narrowly scoped candidate guard reduces
this to the originating manager while preserving existing server/preview cases.

### Reproduction link

https://github.com/benjavicente/storybook-run-all-repro

### Reproduction steps

1. Follow the README setup for the pinned HTML/Vite app.
2. Open two manager tabs. Keep Watch off and initialize the runner with one
   selected-story run before checking the global action.
3. Reset `__runAllRepro` in both consoles, then click the global Run tests button
   once in one tab.
4. Inspect `__runAllRepro.summary()` and repeat with one tab as a control.

Expected: one distinct manager origin for the one global action.

Chrome MCP validation on the unpatched app confirms two distinct manager origins
from one global click, observed in both tabs. Clicking from either tab reproduces
it. One-tab controls before and after closing the peer each show one origin.
The runner was warmed with a successful one-tab global run; Watch was off.
See `evidence/browser.json`. Raw forwarded message counts are not request counts.
Both stories pass; duplicate completed executions and Stop behavior were not measured.

### System

Direct pins: Storybook/HTML-Vite/addon-vitest 10.6.5, Vitest/browser-playwright
4.1.12, Playwright 1.60.0, Vite 6.4.2. Validation used Node 26.13.0, pnpm 12.4.1, macOS 27.2 arm64, and Chrome 156.0.0.0.

The repository includes the verified lockfile and sanitized `evidence/system.txt`.

### Additional context

The same unguarded subscription is present in 11.0.0-beta.0 and the checked
`next` commit c77d65454d19950f6cb365d63fcd9f3a6527eba0. Exact source links and
hashes are included in `vendor/SOURCE.json`.

The candidate skips a callback only when origin and receiver are different
`MANAGER` actors. Server-originated actions and server/preview receivers keep
their previous behavior. An actor-ID-only guard would change those cases.

This is a callback-ownership report. The focused test does not establish the
cause of every slow or stuck Stop action or exercise real WebSocket delivery.
