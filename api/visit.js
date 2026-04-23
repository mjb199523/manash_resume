export default async function handler(req, res) {
  try {
    // We switch to a fresh, dedicated namespace with a forced no-cache header
    const response = await fetch('https://api.counterapi.dev/v1/mjb-resume-persistence-v5/visits/up', {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    const data = await response.json();
    
    // Set headers to prevent ANY caching between Vercel and your browser
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.status(200).json(data);
  } catch (error) {
    res.status(200).json({ count: 1, error: 'fallback' });
  }
}
