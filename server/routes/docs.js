const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const archiver = require('archiver');
const crypto = require('crypto');
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const { sendDocsEmail } = require('../utils/sendDocsEmail');

const DATA_DIR = path.join(__dirname, '..', 'data');

// Helper: get submission directory
function getSubmissionDir(submissionId) {
    return path.join(DATA_DIR, submissionId);
}

// Ensure dir exists
function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

// ─── POST /api/docs/create ─────────────────────────────
router.post('/create', (req, res) => {
    try {
        const { brandName, businessType, contactEmail, contactPhone, categories, categoriesDescription } = req.body;

        if (!brandName || !brandName.trim()) return res.status(400).json({ error: 'Brand name is required' });
        if (!businessType) return res.status(400).json({ error: 'Business type is required' });
        if (!contactEmail) return res.status(400).json({ error: 'Contact email is required' });
        if (!contactPhone) return res.status(400).json({ error: 'Contact phone is required' });
        if (!categories || categories.length === 0) return res.status(400).json({ error: 'Categories are required' });

        const submissionId = uuidv4();
        const accessToken = uuidv4();
        const createdAt = new Date().toISOString();

        // Create directories for both docs and menu
        const subDir = getSubmissionDir(submissionId);
        ensureDir(path.join(subDir, 'docs'));
        ensureDir(path.join(subDir, 'logo'));
        ensureDir(path.join(subDir, 'product_images'));
        ensureDir(path.join(subDir, 'menu'));
        ensureDir(path.join(subDir, 'package'));

        // Save meta.json
        fs.writeFileSync(
            path.join(subDir, 'meta.json'),
            JSON.stringify({
                brandName: brandName.trim(),
                businessType,
                contactEmail,
                contactPhone,
                categories: categories || [],
                categoriesDescription: categoriesDescription || '',
                createdAt
            }, null, 2)
        );

        // Insert DB record
        db.prepare(
            'INSERT INTO submissions (id, brand_name, phone, access_token, created_at) VALUES (?, ?, ?, ?, ?)'
        ).run(submissionId, brandName.trim(), businessType, accessToken, createdAt);

        res.json({ submissionId, accessToken });
    } catch (err) {
        console.error('Docs create error:', err);
        res.status(500).json({ error: 'Failed to create submission' });
    }
});

// ─── GET /api/docs/info ────────────────────────
router.get('/info', authMiddleware, (req, res) => {
    try {
        const subDir = getSubmissionDir(req.submissionId);
        const metaPath = path.join(subDir, 'meta.json');

        if (!fs.existsSync(metaPath)) {
            return res.status(404).json({ error: 'Submission not found' });
        }

        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
        const docsDir = path.join(subDir, 'docs');

        let uploadedDocs = [];
        if (fs.existsSync(docsDir)) {
            uploadedDocs = fs.readdirSync(docsDir).filter((f) => !f.startsWith('.')).map(f => f.split('.')[0]);
        }

        res.json({
            brandName: meta.brandName,
            businessType: meta.businessType,
            contactEmail: meta.contactEmail,
            contactPhone: meta.contactPhone,
            uploadedDocs
        });
    } catch (err) {
        console.error('Docs info error:', err);
        res.status(500).json({ error: 'Failed to get info' });
    }
});

// ─── POST /api/docs/upload ────────────────────────
const docsStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(getSubmissionDir(req.submissionId), 'docs');
        ensureDir(dir);
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        // We will store it with a unique name initially, but the client must pass the 'docType' in the body to identify it.
        // Actually, we can use the fieldname directly if it's uploaded individually.
        const ext = path.extname(file.originalname).toLowerCase();
        // The docType will be passed as a field, let's just use the `docType` as the filename + ext to overwrite previous uploads of the same type.
        const docType = req.body.docType || 'unknown';
        cb(null, `${docType}${ext}`);
    },
});

const uploadDocs = multer({
    storage: docsStorage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB size limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF, JPG, and PNG files are allowed'));
        }
    },
});

router.post('/upload', authMiddleware, uploadDocs.single('document'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        res.json({
            success: true,
            docType: req.body.docType,
            filename: req.file.filename,
            originalName: req.file.originalname,
        });
    } catch (err) {
        console.error('Upload document error:', err);
        res.status(500).json({ error: 'Failed to upload document' });
    }
});

// ─── DELETE /api/docs/delete ─────────────────────
router.delete('/delete', authMiddleware, (req, res) => {
    try {
        const { docType } = req.body;
        if (!docType) return res.status(400).json({ error: 'docType is required' });

        const dir = path.join(getSubmissionDir(req.submissionId), 'docs');
        if (fs.existsSync(dir)) {
            const files = fs.readdirSync(dir);
            const fileToDelete = files.find(f => f.startsWith(`${docType}.`));
            if (fileToDelete) {
                fs.unlinkSync(path.join(dir, fileToDelete));
                return res.json({ deleted: true, docType });
            }
        }
        res.status(404).json({ error: 'File not found' });
    } catch (err) {
        console.error('Delete document error:', err);
        res.status(500).json({ error: 'Failed to delete document' });
    }
});

// ─── POST /api/docs/submit ─────────────────────────────
router.post('/submit', authMiddleware, async (req, res) => {
    try {
        const subDir = getSubmissionDir(req.submissionId);
        const metaPath = path.join(subDir, 'meta.json');
        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
        const safeBrandName = (meta.brandName || 'brand').replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').replace(/\s+/g, '_').trim();

        const docsDir = path.join(subDir, 'docs');

        let uploadedDocs = [];
        if (fs.existsSync(docsDir)) {
            uploadedDocs = fs.readdirSync(docsDir).filter((f) => !f.startsWith('.') && f !== 'docs-package.zip');
        }

        // Validate required files based on business type
        const uploadedTypes = uploadedDocs.map(f => f.split('.')[0]);
        let requiredTypes = [];

        if (meta.businessType === 'home') {
            requiredTypes = ['Home_License', 'IBAN_Stamped', 'QID'];
        } else if (meta.businessType === 'commercial') {
            requiredTypes = ['CR', 'Trade_License', 'Computer_Card', 'IBAN_Stamped', 'QID'];
        }

        const missing = requiredTypes.filter(rt => !uploadedTypes.includes(rt));

        if (missing.length > 0) {
            return res.status(400).json({ error: `Missing required documents: ${missing.join(', ')}` });
        }

        const categories = meta.categories || [];
        const categoriesDescription = meta.categoriesDescription || '';

        // ── Rename Files Server-Side to include BrandName ──
        let renamedDocs = [];
        uploadedDocs.forEach(f => {
            const ext = path.extname(f);
            const docType = f.split('.')[0];
            const newName = `${docType}_${safeBrandName}${ext}`;
            const oldPath = path.join(docsDir, f);
            const newPath = path.join(docsDir, newName);

            // Only rename if it doesn't already have the safeBrandName suffix (prevent double renaming bugs)
            if (f !== newName) {
                fs.renameSync(oldPath, newPath);
            }
            renamedDocs.push(newName);
        });

        // ── Generate ZIP ──
        const zipFilename = `docs-package.zip`;
        const zipPath = path.join(subDir, 'docs', zipFilename);

        await new Promise((resolve, reject) => {
            const output = fs.createWriteStream(zipPath);
            const archive = archiver('zip', { zlib: { level: 9 } });

            output.on('close', resolve);
            archive.on('error', reject);
            archive.pipe(output);

            renamedDocs.forEach((f) => {
                // Ensure proper sanitized naming in ZIP
                archive.file(path.join(docsDir, f), { name: f });
            });

            const docInfoTxt = `Brand Name: ${meta.brandName}
Business Type: ${meta.businessType}
Contact Email: ${meta.contactEmail}
Contact Phone: ${meta.contactPhone}
Product Categories: ${categories.join(', ')}
${categoriesDescription ? `\nCategory Description:\n${categoriesDescription}` : ''}`;

            archive.append(docInfoTxt, { name: 'info.txt' });

            archive.finalize();
        });

        // ── Generate Secure Token & DB Update ──
        const docsToken = crypto.randomBytes(32).toString('hex');

        // Update DB with the secure docsToken
        db.prepare('UPDATE submissions SET docs_token = ? WHERE id = ?').run(
            docsToken,
            req.submissionId
        );

        // Call email notification (fire and forget basically)
        sendDocsEmail({
            brandName: meta.brandName,
            businessType: meta.businessType,
            contactEmail: meta.contactEmail,
            contactPhone: meta.contactPhone,
            categories: meta.categories,
            categoriesDescription: meta.categoriesDescription,
            docsList: renamedDocs,
            docsToken: docsToken
        }).catch(emailErr => {
            console.error('Non-blocking error: Failed to send docs email', emailErr);
        });

        res.json({
            success: true,
            message: 'Documents successfully submitted'
        });

    } catch (err) {
        console.error('Submit docs error:', err);
        res.status(500).json({ error: 'Failed to process documents submission' });
    }
});

module.exports = router;
