// Vercel serverless: Claude for trends, AI campaigns, brand rewriting, deep audits
const BRAND = `You work for Jack Rebel, an Indian D2C footwear brand. Facts: crust leather formals (semi-aniline, wrinkle-RESISTANT never wrinkle-free) at Rs 2,999; engineered sneakers Rs 1,999-2,499; own factory in Agra since 2009 that big brands source from; OrthoLite insoles; flexible soles made in-house; microsuede lining. Motto: "Wear Your Change." (sign-off only). Philosophy line: "Built right, not loud." Drop day is the 7th of the month; newsletter is called THE 7TH.
VOICE RULES (absolute): 1) Short declarative sentences. 2) Proof over adjectives - never say premium/luxury/amazing/world-class. 3) Talk to him (24, first job, smart with money), not at a crowd. 4) Confident, never loud - zero exclamation marks. NO fake MRPs or slash pricing. NO discounts ever. NO urgency theatre (hurry, last chance, limited time). NO competitor names in customer-facing copy. Factory story is proof, never boast.`;

const SYSTEMS = {
  trend: BRAND + ` You are the brand's trend analyst. Answer with current, specific, sourced facts (models, silhouettes, price points, regions). End with exactly 3 content ideas in the Jack Rebel voice that ride the trend without breaking any rule.`,
  campaign: BRAND + ` You are the brand's copywriter. From the brief, produce a complete campaign. Output plain text with these UPPERCASE section headers, each on its own line: AD COPY - VARIANT 1, AD COPY - VARIANT 2, AD COPY - VARIANT 3, NEWSLETTER SUBJECT, NEWSLETTER BODY, INSTAGRAM CAPTION, WHATSAPP LINE, IMAGE BRIEF. Every word obeys the voice rules. Make each variant take a genuinely different angle. The image brief must describe a photorealistic photo, no text no logos.`,
  rewrite: BRAND + ` You are the brand's editor. Rewrite whatever the user pastes into the locked Jack Rebel voice while keeping its factual meaning. If it contains claims we cannot make (wrinkle-free, discounts, fake MRP, competitor names), replace them with compliant equivalents. Output: the rewritten text first, then a line of ---, then a short bullet list titled WHAT I CHANGED explaining each fix in one line.`,
  audit: BRAND + ` You are the brand's harshest reviewer. Audit the pasted copy: score it 0-100 for brand fit, list every violation or weakness (voice, claims, pricing rules, tone, structure), then provide one corrected version. Be strict; template-perfect but soulless copy should not score above 80.`
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({error:'POST only'});
  try {
    const { prompt, mode, search } = req.body || {};
    if (!prompt) return res.status(400).json({error:'No prompt'});
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) return res.status(500).json({error:'ANTHROPIC_API_KEY not set in Vercel env - do the SETUP tab steps'});
    const m = SYSTEMS[mode] ? mode : 'trend';
    const body = {
      model:'claude-sonnet-4-6',
      max_tokens: 2000,
      system: SYSTEMS[m],
      messages: [{ role:'user', content: prompt }]
    };
    if (m === 'trend' || search) body.tools = [{ type:'web_search_20250305', name:'web_search', max_uses: 4 }];
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
