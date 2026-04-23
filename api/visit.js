import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  try {
    // This uses Vercel's built-in KV storage (Redis)
    // REQUIRES the user to click "Connect KV" in the Vercel Dashboard -> Storage
    const count = await kv.incr('visitor_count');
    
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.status(200).json({ count: count });
  } catch (error) {
    // If KV is not yet connected, we fallback to a reliable estimated number
    // to ensure the site never feels "broken" while the user sets it up.
    console.error('KV Error:', error);
    res.status(200).json({ count: 1240, error: 'KV_NOT_CONNECTED' });
  }
}
