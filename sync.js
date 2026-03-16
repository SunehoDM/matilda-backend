// api/sync.js - Matilda sync backend
// Uses Vercel KV for storage

const { kv } = require('@vercel/kv');

const KEY = 'matilda:entries';

const cors = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const entries = await kv.get(KEY) || [];
      return res.status(200).json({ ok: true, entries });
    }

    if (req.method === 'POST') {
      const { action, entries, entry, id } = req.body;

      if (action === 'save_all') {
        await kv.set(KEY, entries);
        return res.status(200).json({ ok: true });
      }
      if (action === 'upsert') {
        const cur = await kv.get(KEY) || [];
        const idx = cur.findIndex(e => e.id === entry.id);
        if (idx > -1) cur[idx] = entry; else cur.unshift(entry);
        await kv.set(KEY, cur);
        return res.status(200).json({ ok: true });
      }
      if (action === 'delete') {
        const cur = await kv.get(KEY) || [];
        await kv.set(KEY, cur.filter(e => e.id !== id && e._parentId !== id));
        return res.status(200).json({ ok: true });
      }
      if (action === 'toggle_done') {
        const cur = await kv.get(KEY) || [];
        const idx = cur.findIndex(e => e.id === id);
        if (idx > -1) cur[idx].done = !cur[idx].done;
        await kv.set(KEY, cur);
        return res.status(200).json({ ok: true });
      }
    }

    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
};
