require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');

const submissionRoutes = require('./routes/submission');
const downloadRoutes = require('./routes/download');
const adminRoutes = require('./routes/admin');
const { runCleanup } = require('./cleanup');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/submission', submissionRoutes);
app.use('/download', downloadRoutes);
app.use('/admin', adminRoutes);
app.use('/api/admin', adminRoutes);

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
