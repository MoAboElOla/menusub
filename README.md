# Menu Submission Portal

A full-stack web application for restaurant/merchant owners to upload brand assets and menu items. Generates downloadable Excel and ZIP packages.

## Quick Start

### 1. Install dependencies

```bash
cd server && npm install
cd ../client && npm install
```

### 2. Configure environment

Edit `server/.env`:

```env
PORT=3001
SESSION_SECRET=your-secret-key
ADMIN_TOKEN=your-admin-password
RETENTION_HOURS=72
RESEND_API_KEY=your-resend-api-key
NOTIFY_EMAIL_TO=your-email@example.com
APP_BASE_URL=http://localhost:5173
```

### 3. Run the app

**Terminal 1 — Backend:**
```bash
cd server
npm start
```

**Terminal 2 — Frontend:**
```bash
cd client
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## How It Works

### User Flow
1. **Gateway (`/start`)** — Choose to upload documents or build menu
2. **Docs Portal** — Provide basic info (Home/Commercial type) and upload required certificates (CR, IBAN, etc.)
3. **Docs Submission** — Generates a secure `docs-package.zip`, emails admin, and seamlessly hands off to the Menu flow.
4. **Menu Portal** — Upload brand assets (warns if below 1000×1000).
5. **Menu Items** — Add menu items with names (EN/AR), descriptions, price, category, barcode, and images (auto-saves).
6. **Review & Submit** — Generates a Menu ZIP package and Excel file for download. Admin is optionally emailed with a secure download securely link.

### Downloads
- **Docs ZIP Package** contains: `info.txt`, `CR.pdf`, `IBAN_Stamped.pdf`, `Home_License.pdf`, etc.
- **Menu ZIP Package** contains: `logo/`, `product_images/`, `menu/menu.xlsx`, `meta.json`
- **Excel file** contains all menu items in a formatted spreadsheet
- All downloads are accessible via unique, secure download links with token validation (`/dl/docs/:token` or `/download/:subId/:file?accessToken=...`).

### Auto-Deletion
- Files are stored temporarily on disk in `server/data/<submissionId>/`
- A background job runs every 60 minutes and deletes submissions older than `RETENTION_HOURS` (default: 72 hours)
- Expired folders and database records are both cleaned up
- Manual cleanup: `POST /admin/cleanup` with `ADMIN_TOKEN`

### Admin Panel
- Visit `/admin` and enter your `ADMIN_TOKEN`
- View last 20 submissions with status, timestamps, and download links
- Trigger manual cleanup

### Security
- Each submission gets a unique `submissionId` + `accessToken` pair
- All API and download routes require valid tokens
- No user authentication required — tokens are stored in `localStorage`

## Tech Stack

| Component | Technology |
|-----------|------------|
| Backend | Node.js + Express |
| Frontend | React (Vite) + Tailwind CSS |
| Database | SQLite (better-sqlite3) |
| Excel | exceljs |
| ZIP | archiver |
| Images | sharp |
| Uploads | multer |
