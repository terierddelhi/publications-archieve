# Publications Archive

A self-hosted, browsable archive of publications with search, topic filters,
and click-to-expand Summary / Recommendations / Conclusion — backed by a
plain JSON file in this repo so it works on GitHub Pages with no server.

- **Anyone** who can view the published site can read all reports.
- **Only people with a GitHub token scoped to this repo** can add or remove
  reports. Adding a report commits directly to `data.json` in this repo, so
  the change is visible to everyone the next time they load the page.

## 1. Publish this repo on GitHub Pages

1. Create a new GitHub repository (public, so Pages can serve it for free —
   private repos need GitHub Pro/Team for Pages).
2. Add these two files to the repo root: `index.html` and `data.json`.
3. Commit and push to the `main` branch.
4. In the repo, go to **Settings → Pages**. Under "Build and deployment",
   set **Source: Deploy from a branch**, branch **main**, folder **/ (root)**.
5. Wait a minute, then open the URL GitHub gives you
   (`https://<your-username>.github.io/<repo-name>/`).

That's it — the site is live and read-only for everyone by default.

## 2. Give yourself (or a teammate) edit access

Only people who complete this step can add or remove reports. It does not
require changing any code or asking a repo admin to do anything special
beyond giving them **write access to the repo** (Settings → Collaborators).

1. On GitHub: **Settings (your account) → Developer settings → Personal
   access tokens → Fine-grained tokens → Generate new token.**
2. Set **Resource owner** to whoever owns this repo, and under
   **Repository access**, choose **Only select repositories** → pick this repo.
3. Under **Permissions → Repository permissions**, set **Contents** to
   **Read and write**. Leave everything else as "No access."
4. Generate the token and copy it (you won't see it again).
5. On the published site, click **⚙ Access** in the header, and enter:
   - Repo owner (your GitHub username or org)
   - Repo name
   - Branch (usually `main`)
   - The token you just generated
6. Click **Save**. The token is stored only in your browser's local storage
   — it's never committed to the repo or sent anywhere except GitHub's API.

Now the **+ Add report** button will actually commit new entries. Anyone
without a token set can still browse and search, they just can't add/remove.

## 3. Day-to-day use

- **Add a report:** click **+ Add report**, choose **Link to PDF** or
  **Upload PDF file**, click **Read PDF text**, then **✨ Extract with AI**
  to auto-draft the Summary / Recommendations / Conclusion (requires the
  Anthropic API key step below). Review/edit the drafted fields, then
  **Save report** — this commits to `data.json`. GitHub Pages typically
  republishes within a minute.
- **Remove a report:** open it, click **Remove this report** (only visible
  if you have a token set).
- **Revoke someone's access:** delete their fine-grained token from
  GitHub (Settings → Developer settings → Personal access tokens), or
  remove them as a repo collaborator. Their saved token stops working
  immediately.

## 4. AI extraction (optional)

To have the app read a PDF and draft the summary fields for you, you can use
either **Google Gemini (genuinely free, ongoing tier)** or **Anthropic
Claude (requires billing)**. Pick one in the ⚙ Access panel's "AI provider"
dropdown.

### Option A — Google Gemini (no billing required)

1. Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
   and sign in with any Google account.
2. Click **Create API key**, choosing **"Create API key in new project"**.
   Do **not** enable billing on that project — the free tier only applies
   to projects without billing enabled.
3. Copy the key (starts with `AIza…`).
4. In the site's **⚙ Access** panel, set **AI provider** to *Google Gemini*,
   paste the key into **Google Gemini API key**, and save.

The free tier is rate-limited (requests per minute/day), not time-limited —
it doesn't expire like a trial. If you hit a `[RATE_LIMIT]` error, just wait
a bit and retry.

### Option B — Anthropic Claude (pay-as-you-go)

1. Get a key from [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)
   (separate account/billing from a claude.ai subscription).
2. In **⚙ Access**, set **AI provider** to *Anthropic Claude*, paste the key
   into **Anthropic API key**, and save.

### Notes for both

- Calls go directly from your browser to whichever provider you pick and
  are billed/rate-limited on your own account — no cost to the repo itself.
- PDF text is read entirely in-browser (via PDF.js), capped at the first
  ~40 pages / ~60,000 characters per report to keep requests reasonable —
  fine for policy papers and reports, may truncate very long documents.
- A **Link to PDF** only works if the source server allows cross-origin
  fetches from a browser; many government/institutional sites block this.
  If fetching fails, download the PDF and use **Upload PDF file** instead.
- Uploaded PDFs can optionally be stored in the repo under `/pdfs` (a
  checkbox at save time). GitHub's simple file-commit API struggles above
  ~5 MB per file — for larger PDFs, leave that unchecked and link to the
  document externally instead.
- Errors from either provider show a specific reason (rate limit, bad key,
  network/CORS block, etc.) instead of a generic failure — see the status
  line under the Extract button.
- Anyone with access to your browser's storage (dev tools) could technically
  read your API key — treat it like the GitHub token: don't share this
  browser/profile, and rotate the key if you're ever unsure.
- If a provider's direct-browser call ever gets blocked by CORS in your
  browser, there's no in-app fallback for that yet — copy the PDF text out
  (open the browser's dev console, or just read the PDF yourself) and paste
  it into that provider's free web chat instead, then paste the answer back
  into the form fields by hand.

## Notes

- This is intentionally simple: no backend, no database, no build step.
  `data.json` *is* the database, and Git history is your audit log/undo.
- If you'd rather not hand out GitHub tokens at all (e.g. a larger,
  less technical team), a small hosted backend (e.g. Supabase) with normal
  email/password login is a better fit — ask and it can be rebuilt that way.
- Reports pulled from the original publication list are marked
  `"unreachable": true` in `data.json` if the source link required
  credentials TERI/your org controls (e.g. a private SharePoint file) —
  edit those entries by hand once you have access to the source.
- Fields marked with `summaryAI` / `recAI` / `conclAI` in `data.json` were
  synthesized by AI rather than pulled near-verbatim from the source and
  are flagged with an "AI-synthesized" badge in the UI — worth a quick
  sanity check against the original PDF before treating them as final.
