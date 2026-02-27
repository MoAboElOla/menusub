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

// Migration to add docs_token safely
try {
    const info = db.pragma('table_info(submissions)');
    const hasDocsToken = info.some(column => column.name === 'docs_token');
    
    if (!hasDocsToken) {
        db.exec("ALTER TABLE submissions ADD COLUMN docs_token TEXT");
        console.log("Migration: Added docs_token column to submissions table");
    }
} catch (err) {
    console.error("Migration warning checks:", err);
}

module.exports = db;
