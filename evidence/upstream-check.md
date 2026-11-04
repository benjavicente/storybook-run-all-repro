# Upstream check, 2026-11-04

Latest stable release from GitHub API: v10.6.5 (2026-10-27).
Current next: c77d65454d19950f6cb365d63fcd9f3a6527eba0; provider source
hash matches the vendored v10.6.5 file.

GitHub issue/PR search (open and closed): `in:title vitest tabs`,
`"onRunAll"`, `in:title "multiple tabs"`, and `"run all" "tabs"`,
all scoped to storybookjs/storybook. No matching duplicate-origin report found
in the returned results; this is not a guarantee of absence.

Next: file the focused duplicate-request issue, then implement the guard and
regression tests in upstream's real store tests, and validate the candidate with
the same browser controls. Confirm intended server/preview semantics with maintainers.
Do not claim a cancellation fix without a separate Stop/recovery reproduction.

## Expanded duplicate search

Searched open/closed issues and PRs for Vitest + twice, duplicate tests,
multiple/two/browser tabs, onRunAll, and run-all + manager. Broad queries
include unrelated results and were narrowed by title/body and inspected candidates.
No exact multi-tab duplicate-run report was identified.

Closest symptom: https://github.com/storybookjs/storybook/issues/30883
(Storybook 9 canary, CLI 89 tests vs UI 178; closed with "This has been fixed").
No reproduction or multi-tab trigger is documented, so common cause is unknown.
https://github.com/storybookjs/storybook/pull/28929 fixes imported-story
transformation side effects, a different documented trigger.
https://github.com/storybookjs/storybook/pull/30491 addresses synchronization
of config/watch state between tabs, not duplicate Run All requests.
https://github.com/storybookjs/storybook/issues/35431 covers store traffic
amplification, not duplicate manager-originated run requests in its body.

Search is not proof that no differently worded report or comment exists.
