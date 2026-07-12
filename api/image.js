// Vercel serverless: image generation via OpenAI or xAI (Grok)
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({error:'POST only'});
  try {
    const { provider, prompt } = req.body || {};
    if (!prompt) return res.status(400).json({error:'No prompt'});
    let url, key, body;
    if (provider === 'grok') {
      key = process.env.XAI_API_KEY;
      if (!key) return res.status(500).json({error:'XAI_API_KEY not set in Vercel env'});
      url = 'https://api.x.ai/v1/images/generations';
      body = { model:'grok-2-image', prompt, n:1, response_format:'b64_json' };
    } else {
      key = process.env.OPENAI_API_KEY;
      if (!key) return res.status(500).json({error:'OPENAI_API_KEY not set in Vercel env'});
      url = 'https://api.openai.com/v1/images/generations';
      body = { model:'gpt-image-1', prompt, n:1, size:'1024x1024' };
    }
    const r = await fetch(url, {
      method:'POST',
      headers:{ 'Authorization':'Bearer '+key, 'Content-Type':'application/json' },
      body: JSON.stringify(body)
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({error:(data.error&&data.error.message)||'Provider error'});
    const b64 = data.data && data.data[0] && (data.data[0].b64_json || null);
    const link = data.data && data.data[0] && (data.data[0].url || null);
    return res.status(200).json({ b64, url: link });
  } catch (e) {
    return res.status(500).json({error: String(e.message||e)});
  }
};
