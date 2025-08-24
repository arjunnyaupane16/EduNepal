// Minimal Express server to register Expo push tokens and schedule a broadcast
// Run with: npm run server (starts node server/index.js)

// Load env vars early
try { require('dotenv').config(); } catch {}
const express = require('express');
const { Expo } = require('expo-server-sdk');
const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const expo = new Expo();
const PORT = process.env.PORT || 4000;

// Supabase service client (requires env SUPABASE_URL and SUPABASE_SERVICE_KEY)
let supabase = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
  supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
} else {
  console.warn('[Server] SUPABASE_URL or SUPABASE_SERVICE_KEY not set. Admin notification endpoints will be disabled.');
}

// In-memory token store. In production, use a DB.
const tokens = new Set();
const emails = new Set();
// In-memory broadcast history for admin visibility
// Each entry: { id, mode: 'now'|'random'|'daily', title, message, status: 'scheduled'|'sent', scheduledAt?, sentAt? }
const broadcastHistory = [];

app.use(express.json());
// Simple CORS for dev and web usage
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

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

// Helper: insert notification row in Supabase and archive JSON to Storage bucket "Notifications"
async function insertAndArchiveNotification({ title, body, audience = 'all', data = {}, created_by = null }) {
  if (!supabase) return null;
  try {
    const { data: inserted, error } = await supabase
      .from('notifications')
      .insert([{ title, body, audience, data, created_by }])
      .select('*')
      .single();
    if (error) {
      console.error('[Supabase] insert notification failed:', error);
      return null;
    }
    try {
      const payload = {
        id: inserted.id,
        title: inserted.title,
        body: inserted.body,
        audience: inserted.audience,
        data: inserted.data || {},
        created_by: inserted.created_by || null,
        created_at: inserted.created_at,
      };
      const buf = Buffer.from(JSON.stringify(payload, null, 2));
      const uploadRes = await supabase.storage
        .from('Notifications')
        .upload(`notifications/${inserted.id}.json`, buf, { contentType: 'application/json', upsert: true });
      if (uploadRes?.error) {
        console.warn('[Storage] Upload notification archive failed:', uploadRes.error.message || uploadRes.error);
      }
    } catch (e) {
      console.warn('[Storage] Exception archiving notification:', e?.message || e);
    }
    return inserted;
  } catch (e) {
    console.error('[Supabase] insertAndArchiveNotification exception:', e?.message || e);
    return null;
  }
}

// Shared helper: send a broadcast to all registered recipients NOW
async function sendBroadcastNow({ title = 'elearnNep', message, mode = 'now' }) {
  if (!message) throw new Error('message is required');
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
    const MAX_BCC = 50;
    for (let i = 0; i < list.length; i += MAX_BCC) {
      const batch = list.slice(i, i + MAX_BCC);
      await mailer.sendMail({
        from: process.env.FROM_EMAIL,
        to: process.env.FROM_EMAIL,
        bcc: batch.join(','),
        subject: title,
        text: message,
      });
    }
  }
  // Also write to Supabase notifications table so push appears in in-app feed (best-effort)
  await insertAndArchiveNotification({
    title,
    body: message,
    audience: 'all',
    data: { type: 'push', mode },
    created_by: null,
  });
}

// Issue a verification code for a purpose: change_password | change_email | delete_account
app.post('/auth/send-code', async (req, res) => {
  try {
    const { email, purpose } = req.body || {};
    const e = String(email || '').trim().toLowerCase();
    const p = String(purpose || '').trim();
    if (!e || !e.includes('@')) return res.status(400).json({ ok: false, error: 'Invalid email' });
    if (!p || !['change_password', 'change_email', 'delete_account', 'elevate_role'].includes(p)) {
      return res.status(400).json({ ok: false, error: 'Invalid purpose' });
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const ttlMs = 10 * 60 * 1000; // 10 minutes
    verifications.set(`${e}|${p}`, { code, expiresAt: Date.now() + ttlMs });
    await sendEmail(e, 'Your elearnNep verification code', `Your ${p.replace('_', ' ')} code is: ${code}. It will expire in 10 minutes.`);
    return res.json({ ok: true, expiresInSeconds: 600 });
  } catch (err) {
    console.error('send-code error:', err);
    return res.status(500).json({ ok: false, error: 'Internal error' });
  }
});

// Admin: list notifications (most recent first)
// Query: ?limit=50&audience=all|user:<id>|segment:<id>
app.get('/admin/notifications', async (req, res) => {
  try {
    if (!supabase) return res.status(500).json({ ok: false, error: 'Supabase not configured' });
    const limit = Math.min(Math.max(parseInt(req.query?.limit || '50', 10) || 50, 1), 200);
    const audience = req.query?.audience ? String(req.query.audience) : null;
    let q = supabase
      .from('notifications')
      .select('id, title, body, audience, data, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (audience) q = q.eq('audience', audience);
    const { data, error } = await q;
    if (error) return res.status(500).json({ ok: false, error: error.message });
    res.json({ ok: true, notifications: data || [] });
  } catch (err) {
    console.error('GET /admin/notifications error:', err);
    res.status(500).json({ ok: false, error: 'Internal error' });
  }
});

// Admin: delete a single notification globally (cascades deliveries) and remove archive file
app.delete('/admin/notifications/:id', async (req, res) => {
  try {
    if (!supabase) return res.status(500).json({ ok: false, error: 'Supabase not configured' });
    const id = String(req.params.id);
    const { error } = await supabase.from('notifications').delete().eq('id', id);
    if (error) return res.status(500).json({ ok: false, error: error.message });
    // Best-effort: remove archived JSON
    try { await supabase.storage.from('Notifications').remove([`notifications/${id}.json`]); } catch {}
    res.json({ ok: true, id });
  } catch (err) {
    console.error('DELETE /admin/notifications/:id error:', err);
    res.status(500).json({ ok: false, error: 'Internal error' });
  }
});

// Admin: bulk delete notifications by ids
app.post('/admin/notifications/bulk-delete', async (req, res) => {
  try {
    if (!supabase) return res.status(500).json({ ok: false, error: 'Supabase not configured' });
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(String) : [];
    if (ids.length === 0) return res.status(400).json({ ok: false, error: 'ids required' });
    const { error } = await supabase.from('notifications').delete().in('id', ids);
    if (error) return res.status(500).json({ ok: false, error: error.message });
    // Best-effort: remove archived files
    try {
      const paths = ids.map(id => `notifications/${id}.json`);
      await supabase.storage.from('Notifications').remove(paths);
    } catch {}
    res.json({ ok: true, deleted: ids.length });
  } catch (err) {
    console.error('POST /admin/notifications/bulk-delete error:', err);
    res.status(500).json({ ok: false, error: 'Internal error' });
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
  const { title = 'elearnNep', message } = req.body || {};
  if (!message) return res.status(400).json({ ok: false, error: 'message is required' });

  const tokenCount = tokens.size;
  const emailCount = emails.size;
  if (tokenCount === 0 && emailCount === 0) return res.status(200).json({ ok: true, scheduledInSeconds: 0, info: 'No recipients registered' });

  const delaySeconds = Math.floor(Math.random() * 86400); // 0..86399
  const scheduledAt = new Date(Date.now() + delaySeconds * 1000).toISOString();

  // Log scheduled broadcast
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  broadcastHistory.unshift({ id, mode: 'random', title, message, status: 'scheduled', scheduledAt, recipients: { tokens: tokenCount, emails: emailCount } });

  setTimeout(async () => {
    try {
      // Send push/email and write to Supabase
      await sendBroadcastNow({ title, message, mode: 'random' });
      // Log sent event
      broadcastHistory.unshift({ id: `${id}-sent`, mode: 'random', title, message, status: 'sent', sentAt: new Date().toISOString(), recipients: { tokens: tokens.size, emails: emails.size } });
      // Optionally: clean up invalid tokens by querying receipts later
    } catch (err) {
      console.error('Broadcast send error:', err);
    }
  }, delaySeconds * 1000);

  return res.json({ ok: true, tokens: tokenCount, emails: emailCount, scheduledInSeconds: delaySeconds, scheduledAt });
});

// Send a broadcast immediately
// Body: { title?: string, message: string }
app.post('/broadcast-now', async (req, res) => {
  try {
    const { title = 'elearnNep', message } = req.body || {};
    if (!message) return res.status(400).json({ ok: false, error: 'message is required' });
    await sendBroadcastNow({ title, message, mode: 'now' });
    const sentAt = new Date().toISOString();
    // Log sent now
    broadcastHistory.unshift({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, mode: 'now', title, message, status: 'sent', sentAt, recipients: { tokens: tokens.size, emails: emails.size } });
    return res.json({ ok: true, tokens: tokens.size, emails: emails.size, sentAt });
  } catch (err) {
    console.error('broadcast-now error:', err);
    return res.status(500).json({ ok: false, error: 'Internal error' });
  }
});

// Admin: create a notification row (all | user:<id> | segment:<id>)
// Body: { title: string, body: string, audience?: string, data?: object, created_by?: uuid }
app.post('/admin/notifications', async (req, res) => {
  try {
    if (!supabase) return res.status(500).json({ ok: false, error: 'Supabase not configured' });
    const { title, body, audience = 'all', data = {}, created_by = null } = req.body || {};
    if (!title || !body) return res.status(400).json({ ok: false, error: 'title and body are required' });

    const { data: inserted, error } = await supabase
      .from('notifications')
      .insert([{ title, body, audience, data, created_by }])
      .select('*')
      .single();

    if (error) {
      console.error('Insert notification error:', error);
      return res.status(500).json({ ok: false, error: 'Failed to insert notification' });
    }

    // Best-effort: archive notification JSON to Storage bucket "Notifications"
    // Path: notifications/<id>.json
    try {
      const payload = {
        id: inserted.id,
        title: inserted.title,
        body: inserted.body,
        audience: inserted.audience,
        data: inserted.data || {},
        created_by: inserted.created_by || null,
        created_at: inserted.created_at,
      };
      const buf = Buffer.from(JSON.stringify(payload, null, 2));
      const uploadRes = await supabase.storage
        .from('Notifications')
        .upload(`notifications/${inserted.id}.json`, buf, { contentType: 'application/json', upsert: true });
      if (uploadRes?.error) {
        console.warn('[Storage] Upload notification archive failed:', uploadRes.error.message || uploadRes.error);
      }
    } catch (e) {
      console.warn('[Storage] Exception archiving notification:', e?.message || e);
    }

    return res.json({ ok: true, notification: inserted });
  } catch (err) {
    console.error('admin/notifications error:', err);
    return res.status(500).json({ ok: false, error: 'Internal error' });
  }
});

// Daily scheduler (simple in-memory timer). Body: { title?: string, message: string, hour: number, minute?: number }
let dailyTimer = null;
let dailyTime = null; // HH:MM string for info
app.post('/schedule-daily', (req, res) => {
  try {
    const { title = 'elearnNep', message, hour, minute = 0 } = req.body || {};
    if (!message) return res.status(400).json({ ok: false, error: 'message is required' });
    const h = Number(hour);
    const m = Number(minute);
    if (!Number.isFinite(h) || h < 0 || h > 23) return res.status(400).json({ ok: false, error: 'invalid hour' });
    if (!Number.isFinite(m) || m < 0 || m > 59) return res.status(400).json({ ok: false, error: 'invalid minute' });

    // Clear previous
    if (dailyTimer) {
      clearTimeout(dailyTimer);
      dailyTimer = null;
    }

    // Compute first run time
    const now = new Date();
    const first = new Date();
    first.setHours(h, m, 0, 0);
    if (first <= now) first.setDate(first.getDate() + 1); // schedule for tomorrow if time already passed
    const initialDelay = first.getTime() - now.getTime();
    dailyTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

    const scheduleNext = () => {
      dailyTimer = setTimeout(async () => {
        try {
          await sendBroadcastNow({ title, message, mode: 'daily' });
          // Log sent event for daily
          broadcastHistory.unshift({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, mode: 'daily', title, message, status: 'sent', sentAt: new Date().toISOString(), recipients: { tokens: tokens.size, emails: emails.size } });
        } catch (e) {
          console.error('daily send error:', e);
        } finally {
          // schedule next day
          scheduleNext();
        }
      }, 24 * 60 * 60 * 1000);
    };

    // Start initial delay, then schedule every 24h via recursive setTimeout
    setTimeout(async () => {
      try {
        await sendBroadcastNow({ title, message, mode: 'daily' });
        // Log first send
        broadcastHistory.unshift({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, mode: 'daily', title, message, status: 'sent', sentAt: new Date().toISOString(), recipients: { tokens: tokens.size, emails: emails.size } });
      } catch (e) {
        console.error('daily first send error:', e);
      } finally {
        scheduleNext();
      }
    }, initialDelay);

    // Log scheduled daily
    broadcastHistory.unshift({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, mode: 'daily', title, message, status: 'scheduled', scheduledAt: first.toISOString(), time: dailyTime, recipients: { tokens: tokens.size, emails: emails.size } });

    return res.json({ ok: true, firstRunAt: first.toISOString(), time: dailyTime });
  } catch (err) {
    console.error('schedule-daily error:', err);
    return res.status(500).json({ ok: false, error: 'Internal error' });
  }
});

app.get('/', (_req, res) => res.send('elearnNep Push Server running'));
app.get('/health', (_req, res) => {
  res.json({ ok: true, uptime: process.uptime(), timestamp: new Date().toISOString() });
});
// Stats for admin UI
app.get('/stats', (_req, res) => {
  res.json({ ok: true, tokens: tokens.size, emails: emails.size, dailyTime });
});
// Broadcast history (most recent first)
app.get('/broadcast-history', (_req, res) => {
  res.json({ ok: true, history: broadcastHistory.slice(0, 100) });
});
// Delete ALL broadcast history
app.delete('/broadcast-history', (_req, res) => {
  try {
    broadcastHistory.length = 0;
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'Failed to clear history' });
  }
});
// Delete selected history items
app.post('/broadcast-history/delete', (req, res) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
    if (ids.length === 0) return res.status(400).json({ ok: false, error: 'ids required' });
    const set = new Set(ids.map(String));
    const before = broadcastHistory.length;
    for (let i = broadcastHistory.length - 1; i >= 0; i--) {
      if (set.has(String(broadcastHistory[i]?.id))) {
        broadcastHistory.splice(i, 1);
      }
    }
    const removed = before - broadcastHistory.length;
    res.json({ ok: true, removed });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'Failed to delete items' });
  }
});
app.listen(PORT, () => console.log(`Push server listening on http://localhost:${PORT}`));
