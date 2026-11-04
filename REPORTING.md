# GitHub reporting handoff

Public reproduction: https://github.com/benjavicente/storybook-run-all-repro

No upstream issue, comment, or pull request has been created.

Validation update: clean install, frozen lockfile, seven protocol tests, static build,
and two CLI story tests pass. Chrome two-tab check is confirmed in
`evidence/browser.json`, including both initiators and one-tab controls.
Candidate browser validation and Stop/recovery remain pending.

## Destination and template

- Repository: <https://github.com/storybookjs/storybook>
- Issue form: <https://github.com/storybookjs/storybook/issues/new?template=bug_report.yml>
- Authoritative template:
  <https://github.com/storybookjs/storybook/blob/next/.github/ISSUE_TEMPLATE/bug_report.yml>
- Suggested title: `[Bug]: Run All invokes Vitest callbacks in both open manager tabs`
- Draft body: `ISSUE_BODY.md`. Keep its leading `🤖 ` when posting or adapting it.

The form requires **Describe the bug**, a public **Reproduction link**, and
**System** information. It also offers **Reproduction steps** and **Additional
context**. A private or nonexistent reproduction URL can cause closure.

Before posting:

1. Review `ISSUE_BODY.md` and `evidence/browser.json`; the reproduction URL is set.
2. Recheck upstream duplicates and source status if time has passed.
3. Obtain authorization to file the upstream issue. Repository publication does
   not authorize filing it. Start external issue bodies/comments/replies with `🤖 `.
4. For the PR, add native upstream regression tests and validate the candidate
   against the same Chrome two-tab/one-tab controls before claiming it fixes the UI.
5. Keep Stop/recovery claims out unless separately reproduced and measured.

## Exact direct versions

| Package | Version |
| --- | --- |
| storybook | 10.6.5 |
| @storybook/html-vite | 10.6.5 |
| @storybook/addon-vitest | 10.6.5 |
| vitest | 4.1.12 |
| @vitest/browser-playwright | 4.1.12 |
| playwright | 1.60.0 |
| vite | 6.4.2 |

Validation used Node 26.13.0, pnpm 12.4.1, and macOS 27.2 arm64. The protocol test needs only Node and is
renderer-independent. The app uses two new HTML counter stories, no custom
rendering lifecycle, screenshots, accessibility addon, or application services.

## Source chain and server distinction

1. [The core provider store](https://github.com/storybookjs/storybook/blob/v10.6.5/code/core/src/shared/test-provider-store/index.ts#L405)
   subscribes every manager's `onRunAll` callback directly to `run-all`.
2. [The Vitest manager](https://github.com/storybookjs/storybook/blob/v10.6.5/code/addons/vitest/src/manager.tsx#L37)
   sends `TRIGGER_RUN` with `triggeredBy: 'run-all'` from that callback.
3. When both managers receive the event, both callbacks can originate a request.
   This differs from a single request being forwarded twice by the server.
   Distinct originating manager actor IDs discriminate these cases.
4. The candidate suppresses only peer-manager callbacks for a manager-originated
   event. It deliberately leaves server-originated actions and server receivers
   unchanged; ask maintainers to confirm the intended cross-environment contract.

## Verified upstream status

The provider-store source is byte-identical in the checked [10.6.5 tag](https://github.com/storybookjs/storybook/blob/v10.6.5/code/core/src/shared/test-provider-store/index.ts),
[11.0.0-beta.0 tag](https://github.com/storybookjs/storybook/blob/v11.0.0-beta.0/code/core/src/shared/test-provider-store/index.ts),
and [next commit c77d654](https://github.com/storybookjs/storybook/blob/c77d65454d19950f6cb365d63fcd9f3a6527eba0/code/core/src/shared/test-provider-store/index.ts).
No upstream release containing the proposed origin guard was verified.
The candidate is a local proposal, not an upstream backport.

## Evidence and limits

- `evidence/protocol.tap`: seven passing real-factory tests with modeled transport.
- `evidence/validation.json`: current validation versions and explicit proof boundaries.
- `vendor/SOURCE.json`: public URLs, exact refs and file hashes.
- `evidence/build.log`: sanitized successful static build output.
- Interactive two-tab proof is recorded; Stop/recovery remains untested.
- The focused protocol test does not exercise UniversalStore leader election, actual WebSockets,
  browser scheduling, the managed Vitest child, or cancellation.
- Do not attach unrelated integration traces or infer a Stop root cause solely
  from the callback test. Keep the report focused on duplicate manager origins.

Cleanup instructions are in `README.md`. The candidate never modifies installed
packages during the Node test.
