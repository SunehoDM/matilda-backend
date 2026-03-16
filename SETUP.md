# Matilda Backend — Vercel Setup

This is the sync backend for Matilda. Takes ~10 minutes to set up, then all devices stay in sync forever.

## Step 1 — Deploy to Vercel

1. Go to vercel.com → sign up with GitHub
2. New Project → Import your `matilda` GitHub repo
   - OR create a separate repo just for this backend folder
3. Vercel auto-detects it as a Node.js project
4. Click Deploy — it gives you a URL like `https://matilda-backend.vercel.app`

## Step 2 — Add KV Database (free)

1. In Vercel dashboard → Storage → Create → KV Database
2. Name it `matilda-kv` → Create
3. Connect it to your project → it auto-adds environment variables

## Step 3 — Update Matilda's index.html

Find this line in `index.html`:
```js
const API_URL = 'YOUR_VERCEL_API_URL/api/sync';
```

Replace `YOUR_VERCEL_API_URL` with your actual Vercel URL:
```js
const API_URL = 'https://matilda-backend.vercel.app/api/sync';
```

Push the updated `index.html` to GitHub.

## Step 4 — Done

Open Matilda on any device. It will say "synced ✦" in the sidebar.
Add an entry on your phone → open on iPad → it's there instantly.

## How it works

- On load: fetches all entries from Vercel KV
- On save/delete/toggle: updates Vercel KV immediately  
- If offline: falls back to localStorage (works without internet)
- No accounts, no passwords, no tokens — just works
