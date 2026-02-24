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
        const { brandName, businessType } = req.body;
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
            JSON.stringify({ brandName: brandName.trim(), businessType: businessType || 'other', createdAt }, null, 2)
        );

        // Insert DB record
        db.prepare(
            'INSERT INTO submissions (id, brand_name, phone, access_token, created_at) VALUES (?, ?, ?, ?, ?)'
        ).run(submissionId, brandName.trim(), businessType || 'other', accessToken, createdAt);

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
            businessType: meta.businessType || 'other',
            createdAt: meta.createdAt,
            logoUploaded: logoFiles.length > 0,
            logoFilename: logoFiles[0] || null,
            imageCount: imageFiles.length,
            menuItems: meta.menuItems || [],
            locationDetails: meta.locationDetails || null,
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

// ─── POST /api/submission/save-location ──────────────────────
router.post('/save-location', authMiddleware, (req, res) => {
    try {
        const { schedule, pickupLocation, operationalPhone } = req.body;
        const subDir = getSubmissionDir(req.submissionId);
        const metaPath = path.join(subDir, 'meta.json');
        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));

        meta.locationDetails = { schedule, pickupLocation, operationalPhone };
        fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));

        res.json({ success: true });
    } catch (err) {
        console.error('Save location error:', err);
        res.status(500).json({ error: 'Failed to save location details' });
    }
});

// ─── Helper: sanitize filename for filesystem safety ─────────
function sanitizeFilename(name) {
    return name.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').replace(/\s+/g, ' ').trim();
}

// ─── Helper: build image rename map ──────────────────────────
function buildImageRenameMap(items) {
    const map = {}; // { originalFilename: renamedFilename }
    const usedNames = new Set();

    items.forEach((item) => {
        if (!item.image) return;
        // Determine the display name: prefer EN, fallback AR, fallback original
        const displayName = (item.item_name_en || item.item_name_ar || '').trim();
        if (!displayName) { map[item.image] = item.image; return; }

        const ext = path.extname(item.image);
        let safeName = sanitizeFilename(displayName);

        // Ensure uniqueness
        let finalName = `${safeName}${ext}`;
        let counter = 2;
        while (usedNames.has(finalName.toLowerCase())) {
            finalName = `${safeName} (${counter})${ext}`;
            counter++;
        }
        usedNames.add(finalName.toLowerCase());
        map[item.image] = finalName;
    });

    return map;
}

// ─── Style an Excel header row ───────────────────────────────
function styleHeaderRow(sheet) {
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
}

// ─── POST /api/submission/submit ─────────────────────────────
router.post('/submit', authMiddleware, async (req, res) => {
    try {
        const subDir = getSubmissionDir(req.submissionId);
        const metaPath = path.join(subDir, 'meta.json');
        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
        const items = meta.menuItems || [];
        const safeBrandName = sanitizeFilename(meta.brandName || 'brand').replace(/\s+/g, '_');

        // Build image rename map
        const renameMap = buildImageRenameMap(items);

        // ── Generate Excel ──
        const workbook = new ExcelJS.Workbook();
        const menuSheet = workbook.addWorksheet('Menu');

        // Calculate max add-ons across all items
        const maxAddons = items.reduce((max, item) => Math.max(max, (item.addons || []).length), 0);

        // Define columns
        const columns = [
            { header: 'Item Name (EN)', key: 'item_name_en', width: 25 },
            { header: 'Item Name (AR)', key: 'item_name_ar', width: 25 },
            { header: 'Description (EN)', key: 'description_en', width: 35 },
            { header: 'Description (AR)', key: 'description_ar', width: 35 },
            { header: 'Price (QAR)', key: 'price', width: 12 },
            { header: 'Category', key: 'category', width: 18 },
            { header: 'Barcode', key: 'barcode', width: 18 },
            { header: 'Image Filename', key: 'image_filename', width: 30 },
        ];

        // Add dynamic add-on columns
        for (let i = 1; i <= maxAddons; i++) {
            columns.push(
                { header: `Option ${i} (EN)`, key: `opt${i}_en`, width: 20 },
                { header: `Option ${i} (AR)`, key: `opt${i}_ar`, width: 20 },
                { header: `Option ${i} Price`, key: `opt${i}_price`, width: 15 }
            );
        }
        menuSheet.columns = columns;
        styleHeaderRow(menuSheet);

        items.forEach((item) => {
            const rowData = {
                item_name_en: item.item_name_en || '',
                item_name_ar: item.item_name_ar || '',
                description_en: item.description_en || '',
                description_ar: item.description_ar || '',
                price: item.price || '',
                category: item.category || '',
                barcode: item.barcode || '',
                image_filename: renameMap[item.image] || item.image || '',
            };

            // Flatten add-ons into the row
            if (item.addons && item.addons.length > 0) {
                item.addons.forEach((addon, idx) => {
                    const i = idx + 1;
                    rowData[`opt${i}_en`] = addon.name_en || '';
                    rowData[`opt${i}_ar`] = addon.name_ar || '';
                    rowData[`opt${i}_price`] = addon.price || '';
                });
            }

            menuSheet.addRow(rowData);
        });

        // Use brand name in Excel filename
        const excelBasename = `menu_${safeBrandName}.xlsx`;
        const excelPath = path.join(subDir, 'menu', excelBasename);

        // Ensure menu directory exists (it should, but just in case)
        if (!fs.existsSync(path.join(subDir, 'menu'))) {
            fs.mkdirSync(path.join(subDir, 'menu'), { recursive: true });
        }

        // Sheet 2: Location & Working Hours
        const locationSheet = workbook.addWorksheet('Location_WorkingHours');
        locationSheet.columns = [
            { header: 'Field', key: 'field', width: 30 },
            { header: 'Value', key: 'value', width: 60 }
        ];
        styleHeaderRow(locationSheet);

        if (meta.locationDetails) {
            const { schedule, pickupLocation, operationalPhone } = meta.locationDetails;

            // Add schedule
            const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            DAYS.forEach(day => {
                const dayKey = day.toLowerCase();
                const dayData = schedule[dayKey];
                let val = 'Closed';
                if (dayData && !dayData.closed) {
                    val = `${dayData.from.h}:${dayData.from.m} ${dayData.from.p} - ${dayData.to.h}:${dayData.to.m} ${dayData.to.p}`;
                }
                locationSheet.addRow({ field: `Working Hours (${day})`, value: val });
            });

            // Add map link
            locationSheet.addRow({ field: 'Pickup Location (Google Maps)', value: pickupLocation || 'None provided' });

            // Add operational phone
            locationSheet.addRow({ field: 'Operational Phone Number', value: operationalPhone || 'None provided' });
        } else {
            locationSheet.addRow({ field: 'Notice', value: 'No location details provided.' });
        }

        await workbook.xlsx.writeFile(excelPath);

        // ── Generate ZIP ──
        const zipFilename = `${safeBrandName}-${req.submissionId.slice(0, 8)}.zip`;
        const zipPath = path.join(subDir, 'package', zipFilename);
        const productImagesFolderName = `product_images_${safeBrandName}`;

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

            // Add product images — renamed + using brand-named folder
            const imgDir = path.join(subDir, 'product_images');
            if (fs.existsSync(imgDir)) {
                const addedFiles = new Set();
                // First: add images that are assigned to items, with renamed filenames
                Object.entries(renameMap).forEach(([originalName, renamedName]) => {
                    const filePath = path.join(imgDir, originalName);
                    if (fs.existsSync(filePath)) {
                        archive.file(filePath, { name: `${productImagesFolderName}/${renamedName}` });
                        addedFiles.add(originalName);
                    }
                });
                // Then: add any unassigned images with their original names
                const allImages = fs.readdirSync(imgDir).filter((f) => !f.startsWith('.'));
                allImages.forEach((f) => {
                    if (!addedFiles.has(f)) {
                        archive.file(path.join(imgDir, f), { name: `${productImagesFolderName}/${f}` });
                    }
                });
            }

            // Add Excel (renamed)
            archive.file(excelPath, { name: `menu/${excelBasename}` });

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

        res.json({
            zipDownloadUrl: `/download/${req.submissionId}/package.zip?accessToken=${req.submission.access_token}`,
            excelDownloadUrl: `/download/${req.submissionId}/menu.xlsx?accessToken=${req.submission.access_token}`,
        });
    } catch (err) {
        console.error('Submit error:', err);
        res.status(500).json({ error: 'Failed to generate files' });
    }
});

module.exports = router;
