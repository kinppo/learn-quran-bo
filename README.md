# Khiarukum backoffice

React + Vite administration app. Arabic is the default, with English and RTL/LTR switching. The legacy logos, blue sidebar (`#3754DB`), primary blue (`#0062FF`), white cards and existing management routes are retained.

## Development

Use Node 24 LTS and Yarn 1.22.22. Copy `.env.example` to `.env`, install with `yarn install --frozen-lockfile`, then run `yarn dev`. Open `http://localhost:5173`. The backend must be healthy on port 8000 with `http://localhost:5173` in `ALLOWED_ORIGINS`. Sign in using the bootstrap administrator configured in `backend/.env`; no credentials are embedded in the web bundle.

`API_PROXY_TARGET` configures the development proxy. Browser requests use `/api/v1` and HttpOnly cookies. The client shares one in-flight refresh request, retries a request once, and returns to login after session expiry. Tokens are never stored in browser localStorage; only the language preference is persisted.

## Reference structure

`app/(pages)` holds explicit page components; `app/components` retains the reference's Blocks, Buttons, Forms, Inputs, Layout, Loaders, Popup and Tables organization. `app/contexts`, `hooks`, `lib/crud.ts`, `constants`, `types`, `utils`, `i18n` and `styles/globals.css` retain its conventions and `@/*` alias.

React Hook Form, Zod, TanStack Table, class-variance-authority, tailwind-merge, Tailwind 4 theme variables, react-icons, dayjs, Jest and Testing Library tooling follow `front-ref`. `use-intl` is the framework-independent core of the reference's next-intl; it replaces Next-specific providers. React Router and explicit lazy imports replace the Next app router. Vite replaces Next build/runtime code. Medical viewers, telemetry and unrelated reference features are not copied.

## Retained routes

| Area | Routes |
| --- | --- |
| Login / home | `/login`, `/`, `/dashboard` |
| Students | `/students`, `/edit-student/:id` |
| Teachers | `/teachers`, `/add-teacher`, `/edit-teacher/:id` |
| Groups | `/groups`, `/add-group`, `/edit-group/:id` |
| Programs | `/programs`, `/add-program`, `/edit-program/:id` |
| Categories | `/categories`, `/add-category`, `/edit-category/:id` |
| Riwayat | `/riwayat`, `/add-riwaya`, `/edit-riwaya/:id` |

Lists support bounded server pagination, search, selection, edit/delete and CSV export. Student filters combine identity, status, date, program and group criteria. CSV export uses the selected rows or all filtered records, and escapes spreadsheet formula prefixes. Bulk actions report partial failures instead of claiming complete success. Referenced records remain protected by the API.

Group forms retain teacher/auditor assignments, teaching language, meeting metadata and weekly sessions. Edits preserve planning IDs and validate overlaps. Teacher photos use private MinIO uploads assigned by Admin to the teacher. Student details include account data and API statistics. The legacy home was a placeholder and remains a simple home page. Payment controls and unsupported dead navigation links are absent; no replacement features are invented.

Canonical reference data must be configured in the backend. Empty catalogs remain empty instead of displaying fabricated options. Only Arabic and English content fields are available. Program completion duration is explicitly in months, matching the new API.

## Production container

Run `docker compose up -d --build --wait`. This Compose project contains exactly one `backoffice` service. Nginx serves static assets, supports direct-link SPA navigation and proxies `/api/` to `API_UPSTREAM` (default `http://host.docker.internal:8000`). It can reach the separate backend project through the host on Docker Desktop and Linux host-gateway. Set a suitable upstream when deploying elsewhere.

`WEB_PORT` defaults to 5173. Keep the public origin in backend `ALLOWED_ORIGINS`. Production HTTPS and secure cookies are configured with the backend and ingress when hosting is available. `API_UPSTREAM` is runtime configuration; `VITE_API_URL` is build-time public configuration and must never contain secrets.

## Checks

`yarn typecheck`, `yarn lint`, `yarn format:check`, `yarn test`, `yarn test:e2e`, `yarn build`.

Install Chromium first with `yarn playwright install chromium`. Standard browser tests mock HTTP to exercise route protection, both locales, empty/error states, validation and responsive layout. The real-backend browser test is opt-in: set `KHIARUKUM_REAL_E2E=1` and run `yarn playwright test test/browser/real-api.spec.ts`. It requires the sibling backend's local `.env`, creates explicitly named test records and cleans them up. Run this only against the local development backend. Traces may contain form data; `test-results` and browser reports are ignored by Git and Docker.

Set `BACKOFFICE_URL=http://localhost:5173` to run against the built container instead of starting Vite. See `docs/verification.md` for results and remaining external checks.

## GitHub Actions

The reference GHCR → SSH/Compose pattern is retained in `.github/workflows/deploy.yml`. Checks and browser tests gate main image publication. Image names derive from the repository. Deployment stays disabled until repository variable `DEPLOY_ENABLED=true` is set. Configure environment `production` plus secrets `SSH_PRIVATE_KEY`, `SSH_KNOWN_HOSTS`, `SSH_HOST`, `SSH_USER` and `WORK_DIR`; provision the remote Compose configuration yourself. The deployment pulls the commit-tagged image and waits for health. No remote repository or server was created.
