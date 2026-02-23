const fs = require('fs');
const path = require('path');
const db = require('./db');

const DATA_DIR = path.join(__dirname, 'data');

function runCleanup() {
    const retentionHours = parseInt(process.env.RETENTION_HOURS) || 72;
    const cutoff = new Date(Date.now() - retentionHours * 60 * 60 * 1000).toISOString();

    console.log(`[Cleanup] Running cleanup. Deleting submissions older than ${retentionHours}h (before ${cutoff})`);

    const expired = db
        .prepare('SELECT id FROM submissions WHERE created_at < ?')
        .all(cutoff);

    let deletedCount = 0;

    for (const sub of expired) {
        const subDir = path.join(DATA_DIR, sub.id);
        try {
            if (fs.existsSync(subDir)) {
                fs.rmSync(subDir, { recursive: true, force: true });
            }
            db.prepare('DELETE FROM submissions WHERE id = ?').run(sub.id);
            deletedCount++;
            console.log(`[Cleanup] Deleted submission ${sub.id}`);
        } catch (err) {
            console.error(`[Cleanup] Error deleting ${sub.id}:`, err.message);
        }
    }

    console.log(`[Cleanup] Done. Deleted ${deletedCount} submissions.`);
    return deletedCount;
}

module.exports = { runCleanup };
