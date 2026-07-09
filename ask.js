// Vercel serverless: Claude with live web search — trends, research, content ideas
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({error:'POST only'});
  try {
    const { prompt, search } = req.body || {};
    if (!prompt) return res.status(400).json({error:'No prompt'});
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) return res.status(500).json({error:'ANTHROPIC_API_KEY not set in Vercel env'});
    const body = {
      model:'claude-sonnet-4-6',
      max_tokens: 1500,
      system: "You are the brand strategist for Jack Rebel, an Indian D2C footwear brand (crust leather formals + engineered sneakers, factory-direct from Agra, honest single pricing, motto 'Wear Your Change', voice: short declarative sentences, proof over adjectives, no exclamation marks, no hype words like premium/luxury/amazing). Answer concisely with current, sourced facts. When asked for trends or bestsellers, give specifics (models, silhouettes, price points, regions) then end with exactly 3 content ideas in the Jack Rebel voice that ride the trend without breaking brand rules (no discounts, no fake urgency, no competitor names in customer copy).",
      messages: [{ role:'user', content: prompt }]
    };
    if (search) body.tools = [{ type:'web_search_20250305', name:'web_search', max_uses: 4 }];
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method:'POST',
      headers:{ 'x-api-key':key, 'anthropic-version':'2023-06-01', 'Content-Type':'application/json' },
      body: JSON.stringify(body)
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({error:(data.error&&data.error.message)||'API error'});
    const text = (data.content||[]).filter(b=>b.type==='text').map(b=>b.text).join('\n');
    return res.status(200).json({ text });
  } catch (e) {
    return res.status(500).json({error: String(e.message||e)});
  }
};
