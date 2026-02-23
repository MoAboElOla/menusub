const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'data', 'submissions.db');

// Ensure data directory exists
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Create submissions table
db.exec(`
  CREATE TABLE IF NOT EXISTS submissions (
    id TEXT PRIMARY KEY,
    brand_name TEXT NOT NULL,
    phone TEXT,
    access_token TEXT NOT NULL,
    status TEXT DEFAULT 'draft',
    menu_items TEXT,
    created_at TEXT NOT NULL,
    submitted_at TEXT
  )
`);

module.exports = db;
