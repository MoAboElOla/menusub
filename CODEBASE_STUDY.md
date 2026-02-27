# Menu Submission — Codebase Study & Improvement Plan

## 1) What the product does today

Menu Submission is a lightweight full-stack portal that lets a merchant submit brand assets and menu data in a guided multi-step flow, then generate downloadable deliverables (ZIP + Excel).

Core user flow:
1. Create a submission with brand name + business type.
2. Upload a logo and product images (with server-side image dimension checks).
3. Build menu items and attach uploaded images.
4. Add location/working-hours information.
5. Submit to generate:
   - a ZIP package (logo, images, Excel, meta), and
   - an Excel workbook with menu and location sheets.

Each submission is stored under `server/data/<submissionId>/` and tracked in SQLite. Access is protected by `submissionId + accessToken`. Data expires via periodic cleanup.

---

## 2) Architecture and how it works

### Frontend (React + Vite + Tailwind)

- Routing and app shell in `client/src/App.jsx`.
- Step pages:
  - `Landing.jsx` (submission creation)
  - `Assets.jsx` (logo + product image uploads)
  - `Menu.jsx` (menu editing, categories/add-ons, drag/drop image assignment)
  - `Location.jsx` (schedule, map link, operational phone)
  - `Review.jsx` (summary + final submit)
  - `Success.jsx` (download action)
  - `Admin.jsx` (admin token-based dashboard)
- API helper (`client/src/api.js`) uses headers for auth tokens and XHR for upload progress.
- i18n in `client/src/i18n.jsx` with English/Arabic dictionaries and RTL support.

### Backend (Node + Express + SQLite)

- Entry point: `server/index.js`.
- Data persistence:
  - SQLite DB (`server/db.js`) for submission metadata/status.
  - File storage under `server/data/<submissionId>/`.
- Submission routes (`server/routes/submission.js`):
  - create submission
  - upload logo/images
  - list/delete images
  - get submission info
  - save menu
  - save location
  - submit/generate Excel+ZIP
- Download routes (`server/routes/download.js`): serve ZIP, Excel, image/logo files using query-token auth.
- Admin routes (`server/routes/admin.js`): list recent submissions, run cleanup.
- Cleanup (`server/cleanup.js`): hourly cron + manual trigger delete expired folders + DB rows.
- Email utility (`server/utils/sendZipDownloadEmail.js`): sends notification once on first ZIP download.

### Data model and storage behavior

- DB table: `submissions` (`id`, `brand_name`, `phone` [currently stores businessType], `access_token`, `status`, `menu_items`, timestamps).
- `meta.json` stores richer payload (brand name, business type, menu items, location details, zipDownloadedAt).
- Generated artifacts live in per-submission `menu/` and `package/` subfolders.

---

## 3) Current strengths

1. **Simple and pragmatic implementation** suitable for low-friction operations.
2. **End-to-end submission pipeline** is complete (create → upload → structure data → generate package).
3. **Good UX touches**:
   - upload progress,
   - image-size warnings/rejections,
   - drag-drop image assignment,
   - bilingual text and RTL.
4. **Operational safeguards**:
   - expiring data with scheduled cleanup,
   - token-gated routes,
   - admin panel for observability and manual maintenance.

---

## 4) Key risks / issues found

### A. Functional correctness issues

1. **Excel download endpoint likely broken after submit rename**  
   Submit writes `menu/menu_<brand>.xlsx`, but download route looks for `menu/menu.xlsx`. This can make Excel download 404 even after successful generation.

2. **Potential crash in `Menu.jsx` autosave condition**  
   The autosave `if` mixes `&&` and `||` without grouping, which can evaluate `items[0].item_name_ar` even when `items[0]` may be undefined.

3. **Auth check bug in `Location.jsx`**  
   It checks `if (!auth)` even though `getAuth()` returns an object, so missing credentials can slip through until API failure.

### B. Security and hardening gaps

1. **No rate limiting / abuse protection** on submission and upload endpoints.
2. **CORS is fully open** by default; should be environment-restricted.
3. **Download routes do not path-normalize requested filenames** (logo/image routes should enforce resolved path boundaries).
4. **Admin token fallback default (`admin-secret`) is dangerous in production** if env var omitted.
5. **Tokens in localStorage** are vulnerable to XSS persistence.

### C. Data / domain modeling issues

1. `phone` DB column is used to store `businessType` from create route, which is semantically misleading and likely legacy drift.
2. Data is duplicated across DB and `meta.json` without reconciliation strategy.
3. Missing schema migration/versioning strategy for future feature growth.

### D. Scalability & maintainability limitations

1. Single large route module (`submission.js`) mixes concerns (validation, file I/O, Excel, ZIP, domain logic).
2. Synchronous filesystem operations (`fs.*Sync`) block event loop on heavy workloads.
3. No automated test suite (unit/integration/e2e).
4. No request validation library (manual ad-hoc checks only).
5. No structured logging, metrics, or tracing for production diagnostics.

### E. UX/product gaps

1. No resumable upload or chunking for unreliable connections.
2. Weak inline validation in some steps (e.g., URL/phone format). 
3. No explicit draft status progression / recoverable sessions beyond localStorage.
4. Admin page lacks filtering/search/export and richer health indicators.

---

## 5) Recommended improvement roadmap

## Phase 1 — Stabilize correctness (highest priority)

1. Fix Excel filename mismatch in download path and response payload contract.
2. Fix `Menu.jsx` autosave condition with explicit guards and grouped logic.
3. Fix `Location.jsx` auth presence check to validate both tokens.
4. Add centralized input validation (e.g., zod/joi) for all mutation endpoints.
5. Add regression tests for create/upload/save/submit/download flow.

## Phase 2 — Harden security and reliability

1. Add `helmet`, strict CORS allowlist, and rate limiting.
2. Add safer token strategy (short-lived signed tokens or hashed token storage).
3. Enforce production env requirements (fail fast if `ADMIN_TOKEN`/`SESSION_SECRET` missing).
4. Add file path safety checks on all file-serving routes.
5. Introduce error boundaries and consistent error envelope structure.

## Phase 3 — Improve architecture and maintainability

1. Split backend into modules/services:
   - controllers,
   - validators,
   - file storage service,
   - package generation service,
   - repositories.
2. Move from sync FS calls to async where practical.
3. Add DB migrations and schema evolution.
4. Add linting + formatting + CI checks.
5. Add observability basics (request IDs, structured logs, cleanup metrics).

## Phase 4 — Product enhancements

1. Better draft recovery with server-backed progress checkpoints.
2. Bulk CSV/Excel import for menu items.
3. Category management per business type with admin configurability.
4. Image optimization pipeline (compress, normalize, optional background removal).
5. Rich admin analytics (submissions/day, conversion, average completion time).

---

## 6) Suggested quality gates before adding many new features

1. End-to-end happy path test in CI (Playwright or API-driven).
2. Regression tests for package structure and Excel content.
3. Contract tests for key API endpoints.
4. Environment validation on startup.
5. Rollback-safe release checklist for schema/file format changes.

---

## 7) High-confidence summary

This codebase already delivers the core value clearly and can be evolved fast. The best next step before major feature expansion is to invest in **correctness fixes + test coverage + security hardening**. Doing that first will reduce breakage risk and make future improvements dramatically safer and quicker.
