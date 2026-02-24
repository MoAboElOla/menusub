const { Resend } = require('resend');

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * Sends an email notification when a ZIP package is downloaded.
 * @param {string} brandName 
 * @param {number} itemCount 
 */
async function sendZipDownloadEmail(brandName, itemCount) {
    if (!resend) {
        console.log('Resend API key missing, skipping email notification.');
        return;
    }

    const to = process.env.NOTIFY_EMAIL_TO;
    if (!to) {
        console.warn('NOTIFY_EMAIL_TO missing, skipping email notification.');
        return;
    }

    try {
        const timestamp = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Qatar' });
        const { data, error } = await resend.emails.send({
            from: 'Menu Portal <onboarding@resend.dev>',
            to: [to],
            subject: `[Menu Portal] ZIP downloaded – ${brandName}`,
            text: `Brand name: ${brandName}\nItems: ${itemCount}\nDownloaded at: ${timestamp} (Qatar Time)`,
        });

        if (error) {
            console.error('ZIP downloaded email failed:', error);
        } else {
            console.log(`ZIP downloaded email sent for ${brandName}`);
        }
    } catch (err) {
        console.error('ZIP downloaded email failed with exception:', err);
    }
}

module.exports = { sendZipDownloadEmail };
