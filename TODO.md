# GitWise AI — Issue TODO

Canonical tracker for issues found during live browser testing and code review. Each item has a GitHub issue; this file is the cycle board and is updated as work lands.

## Cycle 1 — in progress

- [x] [#3](https://github.com/TenZ07/GitWise-AI/issues/3) Chat transcript is not reset after Re-analyze — keyed `ChatBox`; live-verified.
- [x] [#4](https://github.com/TenZ07/GitWise-AI/issues/4) Home URL validation only checks for substring `github.com` — strict regex + normalization; live-verified.
- [x] [#5](https://github.com/TenZ07/GitWise-AI/issues/5) Add rate limiting to public analyze/chat endpoints — per-IP 429 limiter; live-verified.
- [x] [#6](https://github.com/TenZ07/GitWise-AI/issues/6) React Router v7 future-flag warnings in console — flags enabled; live-verified.

## Cycle 2 — in progress

- [ ] [#21](https://github.com/TenZ07/GitWise-AI/issues/21) Groq 429 TPM limit causes internal error on large repos (`bloodborne_pc`) — prompt/output caps reduced, retry + JSON repair added; pending live verification.

## Backlog

- [ ] [#7](https://github.com/TenZ07/GitWise-AI/issues/7) Dashboard deep links have no repo context (sessionStorage only)
- [ ] [#8](https://github.com/TenZ07/GitWise-AI/issues/8) Feature cards use fixed widths and 12px headings on narrow screens
- [ ] [#9](https://github.com/TenZ07/GitWise-AI/issues/9) Vague error message for missing/nonexistent GitHub repo
- [ ] [#10](https://github.com/TenZ07/GitWise-AI/issues/10) README documents Gemini while backend actually uses Groq
- [ ] [#11](https://github.com/TenZ07/GitWise-AI/issues/11) “Deep code analysis” samples only 10–15 files
- [ ] [#12](https://github.com/TenZ07/GitWise-AI/issues/12) Duplicate `cleanSummaryText` implementations
- [ ] [#13](https://github.com/TenZ07/GitWise-AI/issues/13) Stale root `package.json`
- [ ] [#14](https://github.com/TenZ07/GitWise-AI/issues/14) No automated tests
- [ ] [#15](https://github.com/TenZ07/GitWise-AI/issues/15) Unused dependencies
- [ ] [#16](https://github.com/TenZ07/GitWise-AI/issues/16) Hardcoded MongoDB shard hosts in `buildDirectURI()` fallback
- [ ] [#17](https://github.com/TenZ07/GitWise-AI/issues/17) Stateless chat endpoint has prompt-injection surface
- [ ] [#18](https://github.com/TenZ07/GitWise-AI/issues/18) Missing root `.gitignore` and `LICENSE`
- [ ] [#19](https://github.com/TenZ07/GitWise-AI/issues/19) Icon-only buttons lack accessible labels — deferred by user request
- [ ] [#20](https://github.com/TenZ07/GitWise-AI/issues/20) Old Groq API key exposed in earlier Render logs needs user-side revocation
- [ ] [#2](https://github.com/TenZ07/GitWise-AI/issues/2) Pre-existing: “Failed to Fetch Data from GITHUB !”

## Done

Cycle 1 fixes shipped in commit `6e628ce` and deployed (Render `dep-dc4658ei0phs7398v2bg`, Vercel bundle `index-DYF1DwvK.js`). GitHub issues #3–#6 closed with verification notes.

- [x] Dashboard hook-order crash (React error #310) — fixed in commit `72d9e103`, verified on a fresh deep link with cached repo URL.
- [x] Chat model unavailable (OpenRouter 404 for the old free Nemotron slug) — `OPENROUTER_MODEL` set to `nvidia/nemotron-3.5-lightning:free`, chat retested successfully.
