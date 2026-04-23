export default async function handler(req, res) {
  try {
    // We use a high-stability hit counter service
    // We fetch it from the SERVER to bypass client-side AdBlockers
    const url = 'https://hits.seeyoufarm.com/api/count/incr/badge.svg?url=https%3A%2F%2Fmanashjyoti.vercel.app&count_bg=%2379C83D&title_bg=%23555555&icon=&icon_color=%23E7E7E7&title=hits&edge_flat=false';
    const response = await fetch(url);
    const svgText = await response.text();
    
    // Extract the count from the SVG
    const counts = svgText.match(/>(\d+)</g);
    let count = 0;
    if (counts && counts.length > 0) {
      count = parseInt(counts[counts.length - 1].replace(/>|</g, ''));
    }
    
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.status(200).json({ count: count });
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(200).json({ count: 1, error: 'fallback' });
  }
}
