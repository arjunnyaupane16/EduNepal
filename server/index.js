// Minimal Express server to register Expo push tokens and schedule a broadcast
// Run with: npm run server (starts node server/index.js)

const express = require('express');
const { Expo } = require('expo-server-sdk');
const nodemailer = require('nodemailer');

const app = express();
const expo = new Expo();
const PORT = process.env.PORT || 4000;

// In-memory token store. In production, use a DB.
const tokens = new Set();
const emails = new Set();

app.use(express.json());

// Register or update a push token
app.post('/register-token', (req, res) => {
  const { token } = req.body || {};
  if (!token || !Expo.isExpoPushToken(token)) {
    return res.status(400).json({ ok: false, error: 'Invalid Expo push token' });
  }
  tokens.add(token);
  return res.json({ ok: true });
});

// Register email for fallback notifications
app.post('/register-email', (req, res) => {
  const { email } = req.body || {};
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ ok: false, error: 'Invalid email' });
  }
  emails.add(email.trim().toLowerCase());
  return res.json({ ok: true });
});

// Configure nodemailer if env provided
let mailer = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.FROM_EMAIL) {
  mailer = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

// Simple in-memory verification store
// Map key: `${email.toLowerCase()}|${purpose}` => { code, expiresAt }
const verifications = new Map();

// Helper to send email if mailer configured, otherwise log
async function sendEmail(to, subject, text) {
  if (mailer) {
    await mailer.sendMail({ from: process.env.FROM_EMAIL, to, subject, text });
  } else {
    console.log(`[DEV] Email to ${to} :: ${subject} :: ${text}`);
  }
}

// Issue a verification code for a purpose: change_password | change_email | delete_account
app.post('/auth/send-code', async (req, res) => {
  try {
    const { email, purpose } = req.body || {};
    const e = String(email || '').trim().toLowerCase();
    const p = String(purpose || '').trim();
    if (!e || !e.includes('@')) return res.status(400).json({ ok: false, error: 'Invalid email' });
    if (!p || !['change_password', 'change_email', 'delete_account'].includes(p)) {
      return res.status(400).json({ ok: false, error: 'Invalid purpose' });
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const ttlMs = 10 * 60 * 1000; // 10 minutes
    verifications.set(`${e}|${p}`, { code, expiresAt: Date.now() + ttlMs });
    await sendEmail(e, 'Your EduNepal verification code', `Your ${p.replace('_', ' ')} code is: ${code}. It will expire in 10 minutes.`);
    return res.json({ ok: true, expiresInSeconds: 600 });
  } catch (err) {
    console.error('send-code error:', err);
    return res.status(500).json({ ok: false, error: 'Internal error' });
  }
});

// Verify a code
app.post('/auth/verify-code', (req, res) => {
  try {
    const { email, purpose, code } = req.body || {};
    const e = String(email || '').trim().toLowerCase();
    const p = String(purpose || '').trim();
    const c = String(code || '').trim();
    const key = `${e}|${p}`;
    if (!verifications.has(key)) return res.status(400).json({ ok: false, error: 'No code issued' });
    const entry = verifications.get(key);
    if (!entry || entry.code !== c) return res.status(400).json({ ok: false, error: 'Invalid code' });
    if (Date.now() > entry.expiresAt) {
      verifications.delete(key);
      return res.status(400).json({ ok: false, error: 'Code expired' });
    }
    // One-time use
    verifications.delete(key);
    return res.json({ ok: true });
  } catch (err) {
    console.error('verify-code error:', err);
    return res.status(500).json({ ok: false, error: 'Internal error' });
  }
});

// Schedule a broadcast at a random time within the next 24 hours
// Body: { title?: string, message: string }
app.post('/broadcast-random', async (req, res) => {
  const { title = 'EduNepal', message } = req.body || {};
  if (!message) return res.status(400).json({ ok: false, error: 'message is required' });

  const tokenCount = tokens.size;
  const emailCount = emails.size;
  if (tokenCount === 0 && emailCount === 0) return res.status(200).json({ ok: true, scheduledInSeconds: 0, info: 'No recipients registered' });

  const delaySeconds = Math.floor(Math.random() * 86400); // 0..86399
  const scheduledAt = new Date(Date.now() + delaySeconds * 1000).toISOString();

  setTimeout(async () => {
    try {
      // Push broadcast
      if (tokens.size > 0) {
        const messages = [];
        for (const token of tokens) {
          messages.push({ to: token, sound: 'default', title, body: message, data: { type: 'system' } });
        }
        const chunks = expo.chunkPushNotifications(messages);
        for (const chunk of chunks) {
          await expo.sendPushNotificationsAsync(chunk);
        }
      }

      // Email broadcast (fallback)
      if (mailer && emails.size > 0) {
        const list = Array.from(emails);
        const MAX_BCC = 50; // batch emails
        for (let i = 0; i < list.length; i += MAX_BCC) {
          const batch = list.slice(i, i + MAX_BCC);
          await mailer.sendMail({
            from: process.env.FROM_EMAIL,
            to: process.env.FROM_EMAIL, // primary recipient (self)
            bcc: batch.join(','),
            subject: title,
            text: message,
          });
        }
      }
      // Optionally: clean up invalid tokens by querying receipts later
    } catch (err) {
      console.error('Broadcast send error:', err);
    }
  }, delaySeconds * 1000);

  return res.json({ ok: true, tokens: tokenCount, emails: emailCount, scheduledInSeconds: delaySeconds, scheduledAt });
});

app.get('/', (_req, res) => res.send('EduNepal Push Server running'));

app.listen(PORT, () => console.log(`Push server listening on http://localhost:${PORT}`));
