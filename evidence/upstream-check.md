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
