const { Resend } = require('resend');

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * Sends an email notification when a ZIP package is downloaded.
 * @param {string} brandName 
 * @param {number} itemCount 
 * @param {string} submissionId 
 * @param {string} accessToken 
 */
async function sendZipDownloadEmail(brandName, itemCount, submissionId, accessToken) {
    console.log(`[Email] Attempting to send ZIP download email for ${brandName}...`);

    if (!resend) {
        const partialKey = process.env.RESEND_API_KEY ? `${process.env.RESEND_API_KEY.substring(0, 7)}...` : 'NONE';
        console.warn(`[Email] FAILED: Resend API key missing or not initialized. Loaded key: ${partialKey}`);
        return;
    }

    const to = process.env.NOTIFY_EMAIL_TO;
    if (!to) {
        console.warn('[Email] FAILED: NOTIFY_EMAIL_TO missing in .env.');
        return;
    }

    const appBaseUrl = process.env.APP_BASE_URL || 'http://localhost:3001';
    const downloadLink = `${appBaseUrl}/download/${submissionId}/package.zip?accessToken=${accessToken}`;

    console.log(`[Email] Sending to: ${to}`);

    try {
        const timestamp = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Qatar' });

        const textBody = `Menu ZIP Downloaded!

Brand Name: ${brandName}
Menu Items: ${itemCount}
Downloaded At: ${timestamp} (Qatar Time)

Download Menu ZIP Secure Link:
${downloadLink}

Note: This link will expire after 72 hours according to the retention policy.`;

        const { data, error } = await resend.emails.send({
            from: 'Menu Portal <onboarding@resend.dev>',
            to: [to],
            subject: `[Menu Portal] ZIP Downloaded – ${brandName}`,
            text: textBody,
        });

        if (error) {
            console.error('[Email] Resend API Error:', JSON.stringify(error, null, 2));
        } else {
            console.log(`[Email] SUCCESS: Email sent for ${brandName}. Resend ID: ${data.id}`);
        }
    } catch (err) {
        console.error('[Email] Unexpected exception during send:', err);
    }
}

module.exports = { sendZipDownloadEmail };
