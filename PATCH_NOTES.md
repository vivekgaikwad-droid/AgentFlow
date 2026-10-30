# AgentFlow functional fix notes

## What this version changes
- Replaces the fake `/api/companies/:id/check` result with a real HTTP fetch of the configured public careers URL.
- Replaces the workflow runner's placeholder step summaries with live page checks, extraction of real job-like links from returned HTML, URL-based deduplication, and saving of extracted listings to the running server's store.
- Never fabricates a job when a careers page returns no extractable listings.
- Shows per-company warnings when a page is blocked, unavailable, non-HTML, or likely JavaScript-rendered.
- Removes fabricated starter job postings, run history, approval requests, and audit logs so the dashboard does not pretend that work has already happened.
- Keeps human approval as a gate for a notification draft when new listings are discovered. Approval does not send email; an email provider still needs to be configured.
- Retains the Firebase ID-token verification patch and ignores local secrets/dependencies in Git.

## Important limitations
- Generic HTML extraction cannot reliably read every careers portal. Some sites render jobs with JavaScript, require login, rate-limit requests, or expose data only through a vendor API. Those cases are reported as warnings instead of inventing results.
- Job records are currently held in the Express process memory and reset when the server restarts. Firestore persistence is not yet connected to this Express store.
- Automated scheduled execution and outbound email delivery are not implemented by this patch.

## Run locally
1. Unzip this project into a new folder; keep the original project folder as a backup.
2. Keep your existing `.env` for local development. Do not commit it to GitHub because it contains credentials.
3. In the project folder run `npm install`, then `npm run dev`.
4. Start the Python API separately if your frontend/backend setup uses it: `python -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000`.
5. Sign in and open the Cloud & DevOps Internship Tracker. Run it and inspect each company result/warning. A page with no extractable HTML listings should be reported as such, not treated as proof that no jobs exist.

## Validation
The edited `server.ts` passed a TypeScript transpilation/syntax check. A full dependency-backed type check/build could not be completed in this environment because dependency installation timed out.
