async function fetchWebsite(url) {
  if (!url) return null;
  try {
    if (!url.startsWith("http")) url = "https://" + url;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ResearchAI/1.0)",
        "Accept": "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[\s\S]*?<\/nav>/gi, "")
      .replace(/<footer[\s\S]*?<\/footer>/gi, "")
      .replace(/<header[\s\S]*?<\/header>/gi, "")
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();
    return text.slice(0, 3500);
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "GROQ_API_KEY not set" });

  const ENFORCER = `
QUALITY RULES - FOLLOW EXACTLY:
1. Every section minimum 4-6 sentences. No thin paragraphs.
2. Every insight must be specific - name companies, platforms, behaviors, numbers where available.
3. No filler phrases like "it is important to" or "one should consider". State the insight directly.
4. For competitors, name REAL companies only. No invented names.
5. For trends, name the specific trend and explain the signal clearly.
6. ACCURACY: Only state facts grounded in the website content or user-provided details. If inferring, say "appears to" or "likely". Never fabricate team details, metrics, or product features.
7. When listing items, put each on its own line starting with a number and period.
8. Write like a Bloomberg analyst briefing a senior partner - precise, direct, no corporate speak.
`;

  try {
    const body = req.body;

    let websiteContent = null;
    if (body.websiteUrl) {
      websiteContent = await fetchWebsite(body.websiteUrl);
    }

    const groqMessages = [];
    let systemContent = body.system ? body.system + "\n\n" + ENFORCER : ENFORCER;

    if (websiteContent) {
      systemContent += `\n\nWEBSITE CONTENT (scraped live from ${body.websiteUrl}):\n"""\n${websiteContent}\n"""\nGround your analysis in what this site actually says. Do not invent capabilities or claims not present here.`;
    }

    groqMessages.push({ role: "system", content: systemContent });
    for (const msg of body.messages || []) {
      groqMessages.push({ role: msg.role, content: msg.content });
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        max_tokens: body.max_tokens || 5000,
        temperature: 0.7,
        messages: groqMessages,
      }),
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data?.error?.message || "Groq error" });

    return res.status(200).json({
      content: [{ type: "text", text: data.choices?.[0]?.message?.content || "" }],
      websiteFetched: !!websiteContent,
    });

  } catch (err) {
    return res.status(500).json({ error: err.message || "Server error" });
  }
}
