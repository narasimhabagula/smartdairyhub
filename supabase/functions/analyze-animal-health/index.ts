import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { imageBase64, mimeType } = await req.json();
    if (!imageBase64) {
      return new Response(JSON.stringify({ error: 'imageBase64 required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'AI service not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const dataUrl = `data:${mimeType || 'image/jpeg'};base64,${imageBase64}`;

    const systemPrompt = `You are an expert veterinary AI for Indian dairy animals (cows, buffaloes).
Analyze the animal image and return STRICT JSON matching this TypeScript type:
{
  "animal": string, "breed": string, "disease": string,
  "confidence": number (0-100), "severity": "Mild"|"Moderate"|"Severe",
  "recoveryChance": number (0-100),
  "symptoms": string[],
  "medicines": {"name": string, "dosage": string, "duration": string}[],
  "isolation": string, "nutrition": string[], "vaccination": string, "nextCheckup": string,
  "affectedArea": {"x": number, "y": number, "w": number, "h": number}  // % of image
}
If the animal looks healthy, set disease to "Healthy" and severity to "Mild".
Return ONLY valid JSON, no markdown fences.`;

    const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: [
            { type: 'text', text: 'Diagnose this dairy animal.' },
            { type: 'image_url', image_url: { url: dataUrl } },
          ]},
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      if (resp.status === 429) return new Response(JSON.stringify({ error: 'Rate limit — please retry shortly.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (resp.status === 402) return new Response(JSON.stringify({ error: 'AI credits exhausted.' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      return new Response(JSON.stringify({ error: `AI error: ${txt.slice(0, 200)}` }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content ?? '{}';
    let parsed;
    try { parsed = JSON.parse(content); } catch { parsed = { raw: content }; }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
