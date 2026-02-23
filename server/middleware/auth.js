const db = require('../db');

function authMiddleware(req, res, next) {
    const submissionId = req.headers['x-submission-id'] || req.query.submissionId;
    const accessToken = req.headers['x-access-token'] || req.query.accessToken;

    if (!submissionId || !accessToken) {
        return res.status(401).json({ error: 'Missing submissionId or accessToken' });
    }

    const submission = db.prepare(
        'SELECT * FROM submissions WHERE id = ? AND access_token = ?'
    ).get(submissionId, accessToken);

    if (!submission) {
        return res.status(403).json({ error: 'Invalid submissionId or accessToken' });
    }

    req.submission = submission;
    req.submissionId = submissionId;
    next();
}

module.exports = authMiddleware;
