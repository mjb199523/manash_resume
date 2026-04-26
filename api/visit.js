export default async function handler(req, res) {
  try {
    const { action } = req.query;
    
    // Abacus API requires a proper User-Agent to not hang
    const headers = { 'User-Agent': 'Mozilla/5.0 (compatible; Vercel/Proxy)' };
    
    let url = 'https://abacus.jasoncameron.dev/hit/mjb-resume-2026/visits';
    if (action === 'get') {
      url = 'https://abacus.jasoncameron.dev/get/mjb-resume-2026/visits';
    }

    const response = await fetch(url, { headers });
    const data = await response.json();
    
    // Abacus returns { "value": X }
    const visitorCount = data.value || 0;
    
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.status(200).json({ count: visitorCount });
  } catch (error) {
    console.error('Visitor proxy error:', error);
    res.status(200).json({ count: 1 });
  }
}
