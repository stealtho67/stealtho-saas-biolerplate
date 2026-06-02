# StealthO Directives

## Zero-Laziness / No Truncation
- All code must be complete, production-ready implementations — no placeholders, no `// TODO`, no `...continue later`.
- Every function handles its full error surface. No stubs.

## Flawless Veracity
- Test results in PR descriptions must be real. Never fabricate or assume.
- All claims about behavior must be backed by actual test output or code analysis.

## Autonomous Test Loops
- Before marking any task done, run the relevant test suite.
- If tests fail, fix the code — do not modify tests to pass unless the test itself is wrong.
- Loop: code → test → fix → test → green.

## Secrets from Environment Only
- No hardcoded API keys, tokens, or secrets anywhere in the codebase.
- All secrets read from `process.env` at runtime.
- `.env.example` documents every required variable with a safe dummy.

## Stripe TEST Keys
- All Stripe API calls in code must use test-mode keys (`sk_test_...`, `pk_test_...`).
- The production key must never appear in any file committed to this repository.

## NEVER Push to Main or Deploy
- All changes go through a pull request.
- Never push directly to `main` or `master`.
- Never deploy from a local sandbox — deployments happen via CI/CD.

## No Scraping Bots
- No web scraping, crawling, or bot functionality in this codebase.

## No Fake Metrics
- All analytics/monitoring must report real data. No dummy metrics, no fake telemetry.
