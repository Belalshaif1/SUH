/**
 * @file server/config/email.js
 * @description Centralised email / SMTP configuration.
 *              Nodemailer transporter setup was previously inline inside auth.js.
 *              Moving it here allows any future route (e.g. contact forms) to send
 *              email without duplicating the transporter setup.
 */

const nodemailer = require('nodemailer');

/**
 * The reusable Nodemailer transporter.
 * When SMTP_USER / SMTP_PASS are not set (local dev), email is simulated
 * via console output — see the sendEmail helper below.
 */
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
    },
    logger: true,
    debug: true
});

/**
 * sendEmail — sends an email or falls back to a console simulation.
 * When SMTP credentials are not configured, the code and content are logged
 * to the server console so developers can still test flows locally.
 *
 * @param {string} to      - Recipient email address
 * @param {string} subject - Email subject line
 * @param {string} html    - HTML body of the email
 * @param {string} text    - Plain-text fallback body
 * @returns {Promise<boolean>} true if sent via SMTP, false if simulated
 */
async function sendEmail(to, subject, html, text) {
    console.log(`📧 محاولة إرسال بريد إلى: ${to}`);
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        try {
            const fromName = process.env.SMTP_FROM_NAME || 'Smart University';
            const info = await transporter.sendMail({
                from: `"${fromName}" <${process.env.SMTP_USER}>`,
                to,
                subject,
                text,
                html,
            });
            console.log(`✅ تم إرسال البريد بنجاح! ID: ${info.messageId}`);
            return true;
        } catch (error) {
            console.error('❌ خطأ في إرسال الإيميل:', error);
            throw error; // Throw so controller can catch it
        }
    }

    // Fallback: simulate email via console output (dev mode)
    console.log(`\n📧 [EMAIL SIMULATION] TO: ${to} | SUBJECT: ${subject}\n${text}\n`);
    return false;
}

module.exports = { transporter, sendEmail };
