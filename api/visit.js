export default async function handler(req, res) {
  try {
    const response = await fetch('https://api.counterapi.dev/v1/mjb-resume-final-stable/visits/up');
    const data = await response.json();
    
    // Set headers to prevent caching
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch count', count: 0 });
  }
}
