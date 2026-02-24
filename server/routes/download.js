const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const db = require('../db');

const DATA_DIR = path.join(__dirname, '..', 'data');

// Auth middleware for download routes — uses query param
function downloadAuth(req, res, next) {
    const { submissionId } = req.params;
    const accessToken = req.query.accessToken;

    if (!submissionId || !accessToken) {
        return res.status(401).json({ error: 'Missing credentials' });
    }

    const submission = db.prepare(
        'SELECT * FROM submissions WHERE id = ? AND access_token = ?'
    ).get(submissionId, accessToken);

    if (!submission) {
        return res.status(403).json({ error: 'Invalid credentials' });
    }

    req.submission = submission;
    next();
}

const { sendZipDownloadEmail } = require('../utils/sendZipDownloadEmail');

// GET /download/:submissionId/package.zip
router.get('/:submissionId/package.zip', downloadAuth, async (req, res) => {
    try {
        const subId = req.params.submissionId;
        const subDir = path.join(DATA_DIR, subId);
        const pkgDir = path.join(subDir, 'package');

        if (!fs.existsSync(pkgDir)) {
            return res.status(404).json({ error: 'Package not found' });
        }

        const files = fs.readdirSync(pkgDir).filter((f) => f.endsWith('.zip'));
        if (files.length === 0) {
            return res.status(404).json({ error: 'ZIP file not found' });
        }

        // Email notification logic (One-time only)
        const metaPath = path.join(subDir, 'meta.json');
        if (fs.existsSync(metaPath)) {
            const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
            if (!meta.zipDownloadedAt) {
                meta.zipDownloadedAt = new Date().toISOString();
                fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));

                // Non-blocking email trigger
                const itemCount = meta.menuItems ? meta.menuItems.length : 0;
                sendZipDownloadEmail(meta.brandName, itemCount).catch(err => {
                    console.error('ZIP download email failed (async):', err);
                });
                console.log(`ZIP downloaded for first time: email triggered for ${meta.brandName} (${subId})`);
            }
        }

        const zipPath = path.join(pkgDir, files[0]);
        res.download(zipPath, files[0]);
    } catch (err) {
        console.error('Download ZIP error:', err);
        res.status(500).json({ error: 'Failed to download package' });
    }
});

// GET /download/:submissionId/menu.xlsx
router.get('/:submissionId/menu.xlsx', downloadAuth, (req, res) => {
    try {
        const excelPath = path.join(DATA_DIR, req.params.submissionId, 'menu', 'menu.xlsx');
        if (!fs.existsSync(excelPath)) {
            return res.status(404).json({ error: 'Excel file not found' });
        }
        res.download(excelPath, 'menu.xlsx');
    } catch (err) {
        console.error('Download Excel error:', err);
        res.status(500).json({ error: 'Failed to download Excel' });
    }
});

// GET /download/:submissionId/image/:filename — serve product images
router.get('/:submissionId/image/:filename', downloadAuth, (req, res) => {
    try {
        const imgPath = path.join(
            DATA_DIR,
            req.params.submissionId,
            'product_images',
            req.params.filename
        );
        if (!fs.existsSync(imgPath)) {
            return res.status(404).json({ error: 'Image not found' });
        }
        res.sendFile(imgPath);
    } catch (err) {
        console.error('Serve image error:', err);
        res.status(500).json({ error: 'Failed to serve image' });
    }
});

// GET /download/:submissionId/logo/:filename — serve logo
router.get('/:submissionId/logo/:filename', downloadAuth, (req, res) => {
    try {
        const logoPath = path.join(
            DATA_DIR,
            req.params.submissionId,
            'logo',
            req.params.filename
        );
        if (!fs.existsSync(logoPath)) {
            return res.status(404).json({ error: 'Logo not found' });
        }
        res.sendFile(logoPath);
    } catch (err) {
        console.error('Serve logo error:', err);
        res.status(500).json({ error: 'Failed to serve logo' });
    }
});

module.exports = router;
