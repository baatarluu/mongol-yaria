// Vercel serverless function — AI боловсруулалт (засвар, хураангуй, орчуулга)
// Google Gemini (Google AI Studio) API ашиглана.
// Орчны хувьсагч шаардлагатай: GEMINI_API_KEY
// Vercel → Project → Settings → Environment Variables дээр нэмнэ.
// Түлхүүрийг https://aistudio.google.com/apikey дээрээс үнэгүй авна.

const MODEL = "gemini-2.0-flash";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "POST only" });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({
      error:
        "GEMINI_API_KEY тохируулагдаагүй байна. Vercel-ийн Environment Variables дээр нэмж дахин deploy хийнэ үү.",
    });
    return;
  }

  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const { prompt, text } = body;

    if (!text || !prompt) {
      res.status(400).json({ error: "prompt болон text шаардлагатай" });
      return;
    }

    const out = await callGemini(apiKey, prompt, text);
    res.status(200).json({ text: out });
  } catch (err) {
    res.status(502).json({ error: "AI алдаа: " + (err && err.message) });
  }
}

// Gemini API дуудах хэсэг (Vercel болон Netlify хоёулаа ашиглана)
export async function callGemini(apiKey, prompt, text) {
  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/" +
    MODEL +
    ":generateContent";

  const r = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `${prompt}\n\n"""\n${text}\n"""` }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 2048 },
    }),
  });

  if (!r.ok) {
    const errText = await r.text();
    throw new Error("Gemini: " + errText.slice(0, 200));
  }

  const data = await r.json();
  const parts =
    data &&
    data.candidates &&
    data.candidates[0] &&
    data.candidates[0].content &&
    data.candidates[0].content.parts;
  return (parts && parts.map((p) => p.text).join("")) || "(хоосон хариу)";
}
