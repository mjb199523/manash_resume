export default async function handler(req, res) {
  try {
    // Using Abacus API - verified stable and working
    // This proxy ensures we bypass client-side blockers.
    const response = await fetch('https://abacus.jasoncameron.dev/hit/mjb-resume-2026/visits');
    const data = await response.json();
    
    // Abacus returns { "value": X }
    const visitorCount = data.value || 0;
    
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.status(200).json({ count: visitorCount });
  } catch (error) {
    console.error('Visitor proxy error:', error);
    // Return 1 as an honest fallback if the API is momentarily down
    res.status(200).json({ count: 1 });
  }
}
