# Publications Archive security fixes

These files are based on the current public `main` branch snapshot checked on 2026-10-27. The changes are in PR #5. Cloudflare has built and deployed the preview successfully; production deployment awaits the PR merge.

## Changes

- Closed stored HTML injection paths: topic options use DOM text nodes; report text is escaped; organization/date/id attributes are encoded; source links must resolve to HTTPS and are escaped before use.
- Removed persistent browser storage for GitHub, Gemini, and Anthropic credentials. Existing credentials saved by prior versions are purged on page startup. Credentials now last only for the open tab.
- Added Cloudflare Worker rate limiting at 12 requests per client IP per 60 seconds, using a Wrangler rate-limit binding.
- Enforced the chat request byte cap while reading the request stream, even when Content-Length is absent or inaccurate.
- Enforced PDF byte limits while streaming PDF responses; unknown content lengths cannot cause unbounded `arrayBuffer()` reads. Large PDFs are streamed as Blob bodies to Gemini's upload endpoint.
- Added JSON object validation and a 60-second Gemini generation timeout.

## Deployment notes

1. Review PR #5. It contains the changes to the existing repository files and the regression smoke test.
2. Confirm `namespace_id` in `wrangler.toml` is unique within the Cloudflare account; change it if already in use.
3. Cloudflare preview deployment succeeded for this branch. Merging the PR should trigger the production Worker through the existing GitHub integration. Keep `GEMINI_API_KEY` as a Worker secret and `SITE_ORIGIN` configured as a Worker variable.
4. Configure provider-side quota/usage alerts too. Cloudflare's Worker rate-limit binding is approximate and regional, so it is not a strict global spend cap.
5. Credentials no longer persist across page reloads; editors must enter them again in each tab session.

Validation: `node tests/worker-smoke.mjs` passed. The smoke test covers origin/method validation, rate limiting, request/PDF streaming caps without Content-Length, JSON shape validation, and a mocked end-to-end chat flow. Gemini and Archive.org network calls are mocked; no provider quota was used. The live production branch was not modified when this note was written.
