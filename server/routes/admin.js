const express = require('express');
const router = express.Router();
const db = require('../db');
const { runCleanup } = require('../cleanup');

const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

// Admin auth middleware
function adminAuth(req, res, next) {
    if (!ADMIN_TOKEN) {
        return res.status(503).json({ error: 'Admin routes are disabled: ADMIN_TOKEN is not configured' });
    }

    const token =
        req.headers['x-admin-token'] ||
        req.query.adminToken ||
        req.body?.adminToken;

    if (token !== ADMIN_TOKEN) {
        return res.status(403).json({ error: 'Invalid admin token' });
    }
    next();
}

// POST /admin/cleanup — trigger immediate cleanup
router.post('/cleanup', adminAuth, (req, res) => {
    try {
        const deleted = runCleanup();
        res.json({ success: true, deletedCount: deleted });
    } catch (err) {
        console.error('Cleanup error:', err);
        res.status(500).json({ error: 'Cleanup failed' });
    }
});

// GET /api/admin/submissions — list last 20 submissions
router.get('/submissions', adminAuth, (req, res) => {
    try {
        const retentionHours = parseInt(process.env.RETENTION_HOURS) || 72;
        const submissions = db
            .prepare(
                'SELECT id, brand_name, phone, status, created_at, submitted_at, access_token FROM submissions ORDER BY created_at DESC LIMIT 20'
            )
            .all();

        const result = submissions.map((s) => {
            const createdAt = new Date(s.created_at);
            const expiresAt = new Date(createdAt.getTime() + retentionHours * 60 * 60 * 1000);
            return {
                id: s.id,
                brandName: s.brand_name,
                phone: s.phone,
                status: s.status,
                createdAt: s.created_at,
                expiresAt: expiresAt.toISOString(),
                zipDownloadUrl:
                    s.status === 'submitted'
                        ? `/download/${s.id}/package.zip?accessToken=${s.access_token}`
                        : null,
                excelDownloadUrl:
                    s.status === 'submitted'
                        ? `/download/${s.id}/menu.xlsx?accessToken=${s.access_token}`
                        : null,
            };
        });

        res.json(result);
    } catch (err) {
        console.error('Admin list error:', err);
        res.status(500).json({ error: 'Failed to list submissions' });
    }
});

module.exports = router;
