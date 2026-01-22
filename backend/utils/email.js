const nodemailer = require("nodemailer");

let cachedTransporter = null;

function getTransporter() {
  if (cachedTransporter) return cachedTransporter;
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn("SMTP not fully configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS.");
    return null;
  }

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    // Increase size limits for X-ray attachments
    maxMessageSize: 10 * 1024 * 1024, // 10MB max message size
    maxAttachmentSize: 8 * 1024 * 1024  // 8MB max attachment size
  });

  return cachedTransporter;
}

async function sendEmail({ to, subject, text, html, attachments }) {
  const transporter = getTransporter();
  if (!transporter) {
    throw new Error("SMTP transporter not available (check SMTP_* env vars)");
  }
  const from = process.env.MAIL_FROM || process.env.SMTP_USER;
  const mail = { from, to, subject, text, html };
  if (attachments && Array.isArray(attachments) && attachments.length) {
    mail.attachments = attachments;
  }
  return transporter.sendMail(mail);
}

module.exports = { sendEmail };


