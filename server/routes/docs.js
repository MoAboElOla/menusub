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

        const uploadedDocs = {};
        if (fs.existsSync(docsDir)) {
            const files = fs.readdirSync(docsDir).filter((f) => !f.startsWith('.') && f !== 'docs-package.zip');
            files.forEach(f => {
                let baseType = "unknown";
                for (const dt of ['CR', 'Trade_License', 'Computer_Card', 'IBAN_Stamped', 'QID', 'Home_License']) {
                    if (f.startsWith(dt + '_')) {
                        baseType = dt;
                        break;
                    }
                }
                if (baseType !== "unknown") {
                    if (!uploadedDocs[baseType]) uploadedDocs[baseType] = [];
                    uploadedDocs[baseType].push(f);
                }
            });
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
        // Initially save with a temp name, we will rename it in the route handler after validating N
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `temp_${Date.now()}_${Math.random().toString(36).substring(7)}${ext}`);
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

router.post('/upload', authMiddleware, uploadDocs.array('documents', 3), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }
        const docType = req.body.docType;
        if (!docType) {
            req.files.forEach(f => fs.unlinkSync(f.path));
            return res.status(400).json({ error: 'docType is required' });
        }

        const subDir = getSubmissionDir(req.submissionId);
        const metaPath = path.join(subDir, 'meta.json');
        if (!fs.existsSync(metaPath)) {
            req.files.forEach(f => fs.unlinkSync(f.path));
            return res.status(404).json({ error: 'Submission meta not found' });
        }

        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
        const safeBrandName = (meta.brandName || 'brand').replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').replace(/\s+/g, '_').trim();

        const docsDir = path.join(subDir, 'docs');
        const existingDocs = fs.readdirSync(docsDir).filter((f) => !f.startsWith('.') && f.startsWith(`${docType}_`));

        if (existingDocs.length + req.files.length > 3) {
            // Rollback temp files
            req.files.forEach(f => fs.unlinkSync(f.path));
            return res.status(400).json({ error: 'Maximum 3 files allowed per document type.' });
        }

        // Determine next starting N
        let maxN = 0;
        existingDocs.forEach(f => {
            const parts = f.split('_');
            if (parts.length > 0) {
                // expecting DocType_BrandName_N.ext
                const lastPart = parts[parts.length - 1];
                const nStr = lastPart.split('.')[0];
                const n = parseInt(nStr, 10);
                if (!isNaN(n) && n > maxN) maxN = n;
            }
        });

        const uploadedResult = [];
        let currentN = maxN + 1;

        req.files.forEach((file) => {
            const ext = path.extname(file.originalname).toLowerCase();
            const newName = `${docType}_${safeBrandName}_${currentN}${ext}`;
            const newPath = path.join(docsDir, newName);
            fs.renameSync(file.path, newPath);
            uploadedResult.push(newName);
            currentN++;
        });

        res.json({
            success: true,
            docType: docType,
            filenames: uploadedResult,
        });
    } catch (err) {
        console.error('Upload document error:', err);
        // cleanup temp files if failure
        if (req.files) {
            req.files.forEach(f => {
                if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
            });
        }
        res.status(500).json({ error: 'Failed to upload documents' });
    }
});

// ─── GET /api/docs/preview/:filename ────────────────
router.get('/preview/:filename', authMiddleware, (req, res) => {
    try {
        const filename = req.params.filename;
        const safeFilename = path.basename(filename);
        const filePath = path.join(getSubmissionDir(req.submissionId), 'docs', safeFilename);

        if (fs.existsSync(filePath)) {
            res.sendFile(filePath);
        } else {
            res.status(404).end();
        }
    } catch (err) {
        res.status(500).end();
    }
});

// ─── DELETE /api/docs/delete ─────────────────────
router.delete('/delete', authMiddleware, (req, res) => {
    try {
        const { filename } = req.body;
        if (!filename) return res.status(400).json({ error: 'filename is required' });

        const safeFilename = path.basename(filename);
        const dir = path.join(getSubmissionDir(req.submissionId), 'docs');
        const filePath = path.join(dir, safeFilename);

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            return res.json({ deleted: true, filename: safeFilename });
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

        // Group uploaded files by base type safely recognizing docTypes with underscores
        const typeCount = {};
        uploadedDocs.forEach(f => {
            let baseType = "unknown";
            for (const dt of ['CR', 'Trade_License', 'Computer_Card', 'IBAN_Stamped', 'QID', 'Home_License']) {
                if (f.startsWith(dt + '_')) {
                    baseType = dt;
                    break;
                }
            }
            if (baseType !== "unknown") {
                typeCount[baseType] = (typeCount[baseType] || 0) + 1;
            }
        });

        let requiredTypes = [];
        if (meta.businessType === 'home') {
            requiredTypes = ['Home_License', 'IBAN_Stamped', 'QID'];
        } else if (meta.businessType === 'commercial') {
            requiredTypes = ['CR', 'Trade_License', 'Computer_Card', 'IBAN_Stamped', 'QID'];
        }

        const missing = requiredTypes.filter(rt => !typeCount[rt] || typeCount[rt] < 1);

        if (missing.length > 0) {
            return res.status(400).json({ error: `Missing required documents: ${missing.join(', ')}` });
        }

        const categories = meta.categories || [];
        const categoriesDescription = meta.categoriesDescription || '';

        // Files are strictly renamed upon upload now, so no mass renaming step is necessary.
        const finalDocs = uploadedDocs;

        // ── Generate ZIP ──
        const zipFilename = `docs-package.zip`;
        const zipPath = path.join(subDir, 'docs', zipFilename);

        await new Promise((resolve, reject) => {
            const output = fs.createWriteStream(zipPath);
            const archive = archiver('zip', { zlib: { level: 9 } });

            output.on('close', resolve);
            archive.on('error', reject);
            archive.pipe(output);

            finalDocs.forEach((f) => {
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

        // Call email notification
        sendDocsEmail({
            brandName: meta.brandName,
            businessType: meta.businessType,
            contactEmail: meta.contactEmail,
            contactPhone: meta.contactPhone,
            categories: meta.categories,
            categoriesDescription: meta.categoriesDescription,
            docsList: finalDocs,
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
