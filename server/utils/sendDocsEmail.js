const { Resend } = require('resend');

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * Sends an email notification when a partner uploads their documents
 * @param {Object} params 
 * @param {string} params.brandName 
 * @param {string} params.businessType 
 * @param {string} params.contactEmail
 * @param {string} params.contactPhone
 * @param {string[]} params.categories
 * @param {string} params.categoriesDescription
 * @param {string[]} params.docsList 
 * @param {string} params.docsToken 
 */
async function sendDocsEmail({ brandName, businessType, contactEmail, contactPhone, categories, categoriesDescription, docsList, docsToken }) {
    console.log(`[Email] Attempting to send Docs upload email for ${brandName}...`);

    if (!resend) {
        console.warn(`[Email] FAILED: Resend API key missing or not initialized.`);
        return;
    }

    const to = process.env.NOTIFY_EMAIL_TO;
    if (!to) {
        console.warn('[Email] FAILED: NOTIFY_EMAIL_TO missing in .env.');
        return;
    }

    const port = process.env.PORT || 3001;
    const appBaseUrl = process.env.APP_BASE_URL || `http://localhost:${port}`;
    const downloadLink = `${appBaseUrl}/dl/docs/${docsToken}`;

    console.log(`[Email] Sending Docs email to: ${to}`);

    try {
        const timestamp = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Qatar' });

        const descTxt = categoriesDescription ? `\nCategory description provided:\n${categoriesDescription}\n` : '';

        const textBody = `New Documents Upload Notification!

Brand Name: ${brandName}
Merchant Type: ${businessType}
Official Email: ${contactEmail}
Official Phone: ${contactPhone}

Listed Products / Categories:
${(categories || []).map(cat => `- ${cat}`).join('\n')}
${descTxt}
Uploaded Documents:
${docsList.map(doc => `- ${doc}`).join('\n')}

Timestamp: ${timestamp} (Qatar Time)

Download Documents ZIP Secure Link:
${downloadLink}

Note: This link will securely expire after 72 hours according to the retention policy.`;

        const { data, error } = await resend.emails.send({
            from: 'Menu Portal <onboarding@resend.dev>',
            to: [to],
            subject: `[Snoonu Onboarding] Documents uploaded – ${brandName}`,
            text: textBody,
        });

        if (error) {
            console.error('[Email] Resend API Error for Docs:', JSON.stringify(error, null, 2));
        } else {
            console.log(`[Email] SUCCESS: Docs Upload Email sent for ${brandName}. Resend ID: ${data.id}`);
        }
    } catch (err) {
        console.error('[Email] Unexpected exception during docs email send:', err);
    }
}

module.exports = { sendDocsEmail };
