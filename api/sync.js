// api/sync.js
// Vercel Serverless Function - handles all data sync for Matilda
// Uses Vercel KV (free tier: 30MB, plenty for calendar entries)

import { kv } from '@vercel/kv';

const USER_KEY = 'matilda:entries';
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).set(CORS).end();
  }

  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));

  try {
    if (req.method === 'GET') {
      // Fetch all entries
      const entries = await kv.get(USER_KEY) || [];
      return res.status(200).json({ ok: true, entries });
    }

    if (req.method === 'POST') {
      const { action, entries, entry, id } = req.body;

      if (action === 'save_all') {
        // Full replace (initial sync from localStorage)
        await kv.set(USER_KEY, entries);
        return res.status(200).json({ ok: true });
      }

      if (action === 'upsert') {
        // Add or update a single entry
        const current = await kv.get(USER_KEY) || [];
        const idx = current.findIndex(e => e.id === entry.id);
        if (idx > -1) current[idx] = entry;
        else current.unshift(entry);
        await kv.set(USER_KEY, current);
        return res.status(200).json({ ok: true });
      }

      if (action === 'delete') {
        // Delete entry by id
        const current = await kv.get(USER_KEY) || [];
        const filtered = current.filter(e => e.id !== id && e._parentId !== id);
        await kv.set(USER_KEY, filtered);
        return res.status(200).json({ ok: true });
      }

      if (action === 'toggle_done') {
        // Toggle done status
        const current = await kv.get(USER_KEY) || [];
        const idx = current.findIndex(e => e.id === id);
        if (idx > -1) current[idx].done = !current[idx].done;
        await kv.set(USER_KEY, current);
        return res.status(200).json({ ok: true, done: current[idx]?.done });
      }

      return res.status(400).json({ ok: false, error: 'Unknown action' });
    }

    return res.status(405).json({ ok: false, error: 'Method not allowed' });

  } catch (err) {
    console.error('API error:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
