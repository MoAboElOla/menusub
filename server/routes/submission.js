const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const ExcelJS = require('exceljs');
const archiver = require('archiver');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const DATA_DIR = path.join(__dirname, '..', 'data');

// Helper: get submission directory
function getSubmissionDir(submissionId) {
    return path.join(DATA_DIR, submissionId);
}

// Helper: check image dimensions
async function checkImageDimensions(filePath) {
    try {
        const metadata = await sharp(filePath).metadata();
        const warning =
            metadata.width < 1000 || metadata.height < 1000
                ? `Image resolution (${metadata.width}x${metadata.height}) is below recommended 1000x1000`
                : null;
        return { width: metadata.width, height: metadata.height, warning };
    } catch (err) {
        return { width: 0, height: 0, warning: 'Could not read image dimensions' };
    }
}

// ─── POST /api/submission/create ─────────────────────────────
router.post('/create', (req, res) => {
    try {
        const { brandName, phone } = req.body;
        if (!brandName || !brandName.trim()) {
            return res.status(400).json({ error: 'Brand name is required' });
        }

        const submissionId = uuidv4();
        const accessToken = uuidv4();
        const createdAt = new Date().toISOString();

        // Create directories
        const subDir = getSubmissionDir(submissionId);
        fs.mkdirSync(path.join(subDir, 'logo'), { recursive: true });
        fs.mkdirSync(path.join(subDir, 'product_images'), { recursive: true });
        fs.mkdirSync(path.join(subDir, 'menu'), { recursive: true });
        fs.mkdirSync(path.join(subDir, 'package'), { recursive: true });

        // Save meta.json
        fs.writeFileSync(
            path.join(subDir, 'meta.json'),
            JSON.stringify({ brandName: brandName.trim(), phone: phone || '', createdAt }, null, 2)
        );

        // Insert DB record
        db.prepare(
            'INSERT INTO submissions (id, brand_name, phone, access_token, created_at) VALUES (?, ?, ?, ?, ?)'
        ).run(submissionId, brandName.trim(), phone || '', accessToken, createdAt);

        res.json({ submissionId, accessToken });
    } catch (err) {
        console.error('Create error:', err);
        res.status(500).json({ error: 'Failed to create submission' });
    }
});

// ─── POST /api/submission/upload-logo ────────────────────────
const logoStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(getSubmissionDir(req.submissionId), 'logo');
        // Clear existing logo files
        if (fs.existsSync(dir)) {
            fs.readdirSync(dir).forEach((f) => fs.unlinkSync(path.join(dir, f)));
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `logo${ext}`);
    },
});
const uploadLogo = multer({
    storage: logoStorage,
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Only image files are allowed'));
    },
});

router.post('/upload-logo', authMiddleware, uploadLogo.single('logo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const dims = await checkImageDimensions(req.file.path);
        res.json({
            filename: req.file.filename,
            width: dims.width,
            height: dims.height,
            warning: dims.warning,
        });
    } catch (err) {
        console.error('Upload logo error:', err);
        res.status(500).json({ error: 'Failed to upload logo' });
    }
});

// ─── POST /api/submission/upload-images ──────────────────────
const imagesStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(getSubmissionDir(req.submissionId), 'product_images');
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        // Keep original filename but make unique to avoid collisions
        const ext = path.extname(file.originalname);
        const baseName = path.basename(file.originalname, ext);
        const safeName = baseName.replace(/[^a-zA-Z0-9_\-\u0600-\u06FF]/g, '_');
        const uniqueName = `${safeName}_${Date.now()}${ext}`;
        cb(null, uniqueName);
    },
});
const uploadImages = multer({
    storage: imagesStorage,
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Only image files are allowed'));
    },
});

router.post(
    '/upload-images',
    authMiddleware,
    uploadImages.array('images', 50),
    async (req, res) => {
        try {
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({ error: 'No files uploaded' });
            }
            const results = await Promise.all(
                req.files.map(async (file) => {
                    const dims = await checkImageDimensions(file.path);
                    return {
                        filename: file.filename,
                        originalName: file.originalname,
                        width: dims.width,
                        height: dims.height,
                        warning: dims.warning,
                    };
                })
            );
            res.json(results);
        } catch (err) {
            console.error('Upload images error:', err);
            res.status(500).json({ error: 'Failed to upload images' });
        }
    }
);

// ─── GET /api/submission/images ──────────────────────────────
router.get('/images', authMiddleware, (req, res) => {
    try {
        const dir = path.join(getSubmissionDir(req.submissionId), 'product_images');
        if (!fs.existsSync(dir)) return res.json([]);
        const files = fs.readdirSync(dir).filter((f) => !f.startsWith('.'));
        res.json(files);
    } catch (err) {
        console.error('List images error:', err);
        res.status(500).json({ error: 'Failed to list images' });
    }
});

// ─── GET /api/submission/info ────────────────────────────────
router.get('/info', authMiddleware, (req, res) => {
    try {
        const subDir = getSubmissionDir(req.submissionId);
        const metaPath = path.join(subDir, 'meta.json');
        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));

        const logoDir = path.join(subDir, 'logo');
        const logoFiles = fs.existsSync(logoDir) ? fs.readdirSync(logoDir).filter((f) => !f.startsWith('.')) : [];

        const imgDir = path.join(subDir, 'product_images');
        const imageFiles = fs.existsSync(imgDir) ? fs.readdirSync(imgDir).filter((f) => !f.startsWith('.')) : [];

        res.json({
            brandName: meta.brandName,
            phone: meta.phone,
            createdAt: meta.createdAt,
            logoUploaded: logoFiles.length > 0,
            logoFilename: logoFiles[0] || null,
            imageCount: imageFiles.length,
            menuItems: meta.menuItems || [],
            status: req.submission.status,
        });
    } catch (err) {
        console.error('Info error:', err);
        res.status(500).json({ error: 'Failed to get submission info' });
    }
});

// ─── POST /api/submission/save-menu ──────────────────────────
router.post('/save-menu', authMiddleware, (req, res) => {
    try {
        const { items } = req.body;
        if (!Array.isArray(items)) {
            return res.status(400).json({ error: 'items must be an array' });
        }

        const subDir = getSubmissionDir(req.submissionId);
        const metaPath = path.join(subDir, 'meta.json');
        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
        meta.menuItems = items;
        fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));

        // Also store in DB for quick access
        db.prepare('UPDATE submissions SET menu_items = ? WHERE id = ?').run(
            JSON.stringify(items),
            req.submissionId
        );

        res.json({ success: true, count: items.length });
    } catch (err) {
        console.error('Save menu error:', err);
        res.status(500).json({ error: 'Failed to save menu' });
    }
});

// ─── POST /api/submission/submit ─────────────────────────────
router.post('/submit', authMiddleware, async (req, res) => {
    try {
        const subDir = getSubmissionDir(req.submissionId);
        const metaPath = path.join(subDir, 'meta.json');
        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
        const items = meta.menuItems || [];

        // ── Generate Excel ──
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Menu');

        sheet.columns = [
            { header: 'Item Name (EN)', key: 'item_name_en', width: 25 },
            { header: 'Item Name (AR)', key: 'item_name_ar', width: 25 },
            { header: 'Description (EN)', key: 'description_en', width: 35 },
            { header: 'Description (AR)', key: 'description_ar', width: 35 },
            { header: 'Price', key: 'price', width: 12 },
            { header: 'Category', key: 'category', width: 18 },
            { header: 'Barcode', key: 'barcode', width: 18 },
            { header: 'Image Filename', key: 'image_filename', width: 30 },
        ];

        // Style header row
        sheet.getRow(1).font = { bold: true };
        sheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4472C4' },
        };
        sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

        items.forEach((item) => {
            sheet.addRow({
                item_name_en: item.item_name_en || '',
                item_name_ar: item.item_name_ar || '',
                description_en: item.description_en || '',
                description_ar: item.description_ar || '',
                price: item.price || '',
                category: item.category || '',
                barcode: item.barcode || '',
                image_filename: item.image || '',
            });
        });

        const excelPath = path.join(subDir, 'menu', 'menu.xlsx');
        await workbook.xlsx.writeFile(excelPath);

        // ── Generate ZIP ──
        const safeBrandName = meta.brandName.replace(/[^a-zA-Z0-9_\-\u0600-\u06FF ]/g, '_');
        const zipFilename = `${safeBrandName}-${req.submissionId.slice(0, 8)}.zip`;
        const zipPath = path.join(subDir, 'package', zipFilename);

        await new Promise((resolve, reject) => {
            const output = fs.createWriteStream(zipPath);
            const archive = archiver('zip', { zlib: { level: 9 } });

            output.on('close', resolve);
            archive.on('error', reject);
            archive.pipe(output);

            // Add logo
            const logoDir = path.join(subDir, 'logo');
            if (fs.existsSync(logoDir)) {
                const logoFiles = fs.readdirSync(logoDir).filter((f) => !f.startsWith('.'));
                logoFiles.forEach((f) => archive.file(path.join(logoDir, f), { name: `logo/${f}` }));
            }

            // Add product images
            const imgDir = path.join(subDir, 'product_images');
            if (fs.existsSync(imgDir)) {
                const imgFiles = fs.readdirSync(imgDir).filter((f) => !f.startsWith('.'));
                imgFiles.forEach((f) =>
                    archive.file(path.join(imgDir, f), { name: `product_images/${f}` })
                );
            }

            // Add Excel
            archive.file(excelPath, { name: 'menu/menu.xlsx' });

            // Add meta.json
            archive.file(metaPath, { name: 'meta.json' });

            archive.finalize();
        });

        // Update DB status
        db.prepare('UPDATE submissions SET status = ?, submitted_at = ? WHERE id = ?').run(
            'submitted',
            new Date().toISOString(),
            req.submissionId
        );

        const accessToken = req.submission.access_token;
        res.json({
            zipDownloadUrl: `/download/${req.submissionId}/package.zip?accessToken=${accessToken}`,
            excelDownloadUrl: `/download/${req.submissionId}/menu.xlsx?accessToken=${accessToken}`,
        });
    } catch (err) {
        console.error('Submit error:', err);
        res.status(500).json({ error: 'Failed to generate files' });
    }
});

module.exports = router;
