🤖 ## What I did

Prevent a manager-originated Run All event from invoking provider callbacks in peer managers. With two Storybook tabs open, each manager currently sends its own Vitest request and one click runs the tests twice. The originating manager still invokes its providers; server-originated events and server/preview receivers retain their behavior.

Reproduction and evidence: https://github.com/benjavicente/storybook-run-all-repro

## Checklist for Contributors

### Testing

- [x] unit tests
- [ ] stories
- [ ] integration tests
- [ ] end-to-end tests

Added seven callback-origin cases. The peer-manager regression fails on unchanged upstream; all 21 runtime tests and seven existing type tests pass with the fix:

```sh
yarn vitest run --config code/core/vitest.config.ts --typecheck.tsconfig code/core/tsconfig.json code/core/src/shared/test-provider-store/index.test.ts code/core/src/shared/test-provider-store/index.test-d.ts
```

Core type check, formatting, and focused lint pass (existing lint warnings remain).

#### Manual testing

1. Run a sandbox using this checkout: `yarn task dev --template react-vite/default-ts --start-from auto`.
2. Keep Watch off. Warm the Vitest runner with one global Run tests click and wait for completion.
3. Open the same Storybook in a second tab. Click global Run tests once in A. Verify the server terminal shows one completed run.
4. Repeat from B, then close B and repeat from A. Each click should produce one completed run. Unpatched behavior produces two with both tabs open.

Chrome MCP checks passed for the equivalent guard temporarily applied to the pinned 10.6.5 manager bundles. This is not a full upstream-next browser build. See the reproduction's `evidence/candidate-browser.json` and terminal log. Stop/cancellation was not tested.

### Documentation

No documentation or migration changes needed for this bug fix.

AI assistance: Codex helped implement the fix, regression tests, and validation and prepare this PR description.
