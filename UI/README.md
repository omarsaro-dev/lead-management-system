# LeadFlow frontend

Next.js App Router, React, TypeScript, Tailwind CSS, and Lucide dashboard for the existing FastAPI service. No mock leads, extra database, or replacement backend.

## Run

Requires Node.js 20.9 or newer.

```powershell
cd lead_manegment/UI
npm.cmd install
Copy-Item .env.example .env.local
# Set NEXT_PUBLIC_API_URL in .env.local to your running API's base URL.
npm.cmd run dev
```

Open http://localhost:3000. If `.env.local` already contains your supplied ngrok URL, keep that file instead of overwriting it. `npm.cmd` avoids PowerShell script execution policy restrictions; on macOS/Linux use `npm`.

## Verify and deploy

```sh
npm run typecheck
npm run lint
npm run build
npm start
```

Set `NEXT_PUBLIC_API_URL` in the deployment environment **before building**. Restart development or rebuild production whenever it changes. Deploy to a Next.js Node.js host; static export is not supported because authentication and request forwarding require server route handlers.

## API integration

All service functions are in `lib/api.ts`. Requests go through `/api/leadflow/*`, which an authenticated route handler forwards to `NEXT_PUBLIC_API_URL`. This is a transport proxy to the existing API, not a new backend. It avoids requiring CORS changes and sends the ngrok browser-warning bypass header. See the [Next.js rewrite documentation](https://nextjs.org/docs/app/api-reference/config/next-config-js/rewrites).

- `GET /health` and `GET /leads` run on initial load and refresh.
- Detail dialogs fetch `GET /leads/{email}`.
- Add uses `POST /api/n8n/leads`, whose server-only adapter sends the five lead fields to `N8N_WEBHOOK_URL`. The workflow creates the lead in FastAPI, qualifies it, saves qualification, and sends its configured email. The UI does not separately POST to FastAPI, preventing duplicate creation. Edit and status changes send all four required fields to `PUT /leads/{email}`.
- Delete requires an explicit dialog confirmation and handles the API's empty 204 response.
- `updateQualification()` exposes the existing PATCH endpoint for the qualification workflow.
- Email path values are URL encoded. Requests time out after 15 seconds. API validation messages, conflicts, missing leads, server errors, and network failures surface in the UI.
- Successful mutations update the local view and refresh the server list. A failed refresh retains the last known list with a visible stale-data warning.
- Phone input follows the backend's exactly-11-digits requirement. Status is sent as `state`.

## Existing backend limitation

At implementation time, `Backend/models.py:Lead.show_info()` returns only name, email, phone, service, and state. The storage read methods also omit qualification columns. Although the PATCH endpoint stores AI qualification, the existing GET endpoints do not expose it. The frontend displays “Not scored”, “Unqualified”, and missing-summary messages until the real API returns `score`, `priority`, `ai_summary`, and `next_action`. Missing scores are excluded from averages. No data is fabricated, and no backend files were changed.

Created and updated timestamps are displayed only when the API supplies `created_at` / `updated_at`.

## n8n production workflow

Set `N8N_WEBHOOK_URL` in `.env.local` or the deployment server environment. Use the published/active production webhook, not a test webhook. The supplied workflow accepts `POST` JSON with `name`, `email`, `phone`, `service`, and `state`; it returns `success`, `email`, `score`, and `priority`. The frontend checks `success` even for HTTP 200 because the invalid-input branch also returns 200.

The server waits up to 110 seconds and the client up to 115 seconds. Your hosting platform must support requests of this duration. Requests are never automatically retried or redirected. The workflow saves the lead before AI/email steps, so timeout or later failure may still leave a saved lead; the dashboard refreshes and asks the user to check before resubmitting. Existing-lead updates do not trigger this create-only workflow.

The success toast shows the real score and priority returned by n8n. The dashboard continues to read its persistent values from FastAPI. The supplied webhook response does not include summary or next action; full persistent AI display still requires FastAPI GET responses to expose qualification fields. No browser cache substitutes for missing API data.

## Interface

Dashboard and Leads share live data, immediate search, priority/status/service filters, pagination, name/score sorting, responsive cards, and native keyboard-friendly modal dialogs. Analytics aggregates the returned leads. Settings contains account, session, and workspace refresh controls. Loading skeletons, empty states, retry errors, and notifications are included. The UI requires a signed-in workspace owner. This protects dashboard pages and its server endpoints, not the separately public FastAPI or n8n URLs.

## Workspace sign-in

Run `npm run test:auth` after building to check login, protected routes, session expiry/tampering, logout, and rate limiting without modifying leads. This test script requires Node.js 22.18+ (the application itself supports the Next.js Node version requirement above).

Run `npm.cmd run setup-auth` in UI, enter the owner email, and save the generated password in your password manager. Only its salted scrypt hash is saved to `.env.local`, together with a server-only signing secret. Restart the server after setup. Run setup again to reset the password and invalidate all existing sessions. No default credentials, registration, or user database are added.

Login is at `/login`. Signed HttpOnly SameSite=Strict cookies expire after eight hours; HTTPS requests receive Secure cookies. Sign-out removes the browser cookie. Sessions are stateless; a copied token remains valid until expiry or credential rotation. The login limiter is process-local (ten attempts per fifteen minutes for this single owner); distributed deployment requires shared rate limiting. Frontend pages and both forwarding endpoints require authentication. Only necessary request headers are forwarded; session cookies never go to the upstream services. See [Next.js authentication guidance](https://nextjs.org/docs/app/guides/authentication).
