require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');

const submissionRoutes = require('./routes/submission');
const downloadRoutes = require('./routes/download');
const adminRoutes = require('./routes/admin');
const docsRoutes = require('./routes/docs');
const { runCleanup } = require('./cleanup');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;


if (!process.env.ADMIN_TOKEN) {
    console.warn('⚠️  ADMIN_TOKEN is not configured. Admin routes are disabled until it is set.');
}


// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/submission', submissionRoutes);
app.use('/api/docs', docsRoutes);
app.use('/download', downloadRoutes);
app.use('/admin', adminRoutes);
app.use('/api/admin', adminRoutes);

// Secure Docs Download Endpoint
app.get('/dl/docs/:token', (req, res) => {
    try {
        const { token } = req.params;
        const submission = db.prepare('SELECT id FROM submissions WHERE docs_token = ?').get(token);

        if (!submission) {
            return res.status(404).send('Invalid or expired download link.');
        }

        const pkgPath = path.join(__dirname, 'data', submission.id, 'docs', 'docs-package.zip');
        if (!fs.existsSync(pkgPath)) {
            return res.status(404).send('Document package not found. It may have been deleted by the 72-hour retention policy.');
        }

        res.download(pkgPath, 'docs-package.zip');
    } catch (err) {
        console.error('Docs download error:', err);
        res.status(500).send('Internal server error while downloading documents.');
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve React frontend in production
const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    // All non-API routes fall through to React
    app.get(/^(?!\/api|\/download|\/admin).*/, (req, res) => {
        res.sendFile(path.join(clientDist, 'index.html'));
    });
    console.log('Serving frontend from client/dist');
}

// Schedule cleanup every 60 minutes
cron.schedule('0 * * * *', () => {
    console.log('[Cron] Running scheduled cleanup...');
    runCleanup();
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'File too large. Maximum size is 20MB.' });
    }
    res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Retention: ${process.env.RETENTION_HOURS || 72} hours`);
});
