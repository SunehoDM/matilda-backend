const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Supports both matilda and labplan
function getKey(app) {
  if (app === 'labplan') return 'labplan:entries';
  return 'matilda:entries';
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const app = req.query.app || 'matilda';
    const KEY = getKey(app);

    if (req.method === 'GET') {
      const entries = await redis.get(KEY) || [];
      return res.status(200).json({ ok: true, entries });
    }

    if (req.method === 'POST') {
      const { action, entries, entry, id } = req.body;

      if (action === 'save_all') {
        await redis.set(KEY, entries);
        return res.status(200).json({ ok: true });
      }
      if (action === 'upsert') {
        const cur = await redis.get(KEY) || [];
        const idx = cur.findIndex(e => e.id === entry.id);
        if (idx > -1) cur[idx] = entry; else cur.unshift(entry);
        await redis.set(KEY, cur);
        return res.status(200).json({ ok: true });
      }
      if (action === 'delete') {
        const cur = await redis.get(KEY) || [];
        await redis.set(KEY, cur.filter(e => e.id !== id && e._parentId !== id));
        return res.status(200).json({ ok: true });
      }
      if (action === 'toggle_done') {
        const cur = await redis.get(KEY) || [];
        const idx = cur.findIndex(e => e.id === id);
        if (idx > -1) cur[idx].done = !cur[idx].done;
        await redis.set(KEY, cur);
        return res.status(200).json({ ok: true });
      }
    }

    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
};
