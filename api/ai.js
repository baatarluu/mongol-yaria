// Vercel serverless function — AI боловсруулалт (засвар, хураангуй, орчуулга)
// Орчны хувьсагч шаардлагатай: ANTHROPIC_API_KEY
// Vercel → Project → Settings → Environment Variables дээр нэмнэ.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "POST only" });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({
      error:
        "ANTHROPIC_API_KEY тохируулагдаагүй байна. Vercel-ийн Environment Variables дээр нэмж дахин deploy хийнэ үү.",
    });
    return;
  }

  try {
    // req.body аль хэдийн parse хийгдсэн эсэхийг шалгана
    const body =
      typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const { prompt, text } = body;

    if (!text || !prompt) {
      res.status(400).json({ error: "prompt болон text шаардлагатай" });
      return;
    }

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2048,
        messages: [
          { role: "user", content: `${prompt}\n\n"""\n${text}\n"""` },
        ],
      }),
    });

    if (!r.ok) {
      const errText = await r.text();
      res.status(502).json({ error: "AI үйлчилгээний алдаа: " + errText.slice(0, 200) });
      return;
    }

    const data = await r.json();
    const out =
      (data.content && data.content[0] && data.content[0].text) || "";
    res.status(200).json({ text: out });
  } catch (err) {
    res.status(500).json({ error: "Дотоод алдаа: " + (err && err.message) });
  }
}
