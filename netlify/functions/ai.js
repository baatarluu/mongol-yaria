// Netlify serverless function — AI боловсруулалт (Google Gemini API)
// Орчны хувьсагч шаардлагатай: GEMINI_API_KEY
// Netlify → Site settings → Environment variables дээр нэмнэ.
// Түлхүүрийг https://aistudio.google.com/apikey дээрээс үнэгүй авна.

const MODEL = "gemini-2.0-flash";

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "POST only" }) };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error:
          "GEMINI_API_KEY тохируулагдаагүй байна. Netlify-ийн Environment variables дээр нэмж дахин deploy хийнэ үү.",
      }),
    };
  }

  try {
    const { prompt, text } = JSON.parse(event.body || "{}");
    if (!text || !prompt) {
      return { statusCode: 400, body: JSON.stringify({ error: "prompt болон text шаардлагатай" }) };
    }

    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/" + MODEL + ":generateContent";
    const r = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${prompt}\n\n"""\n${text}\n"""` }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 2048 },
      }),
    });

    if (!r.ok) {
      const errText = await r.text();
      return { statusCode: 502, body: JSON.stringify({ error: "Gemini: " + errText.slice(0, 200) }) };
    }

    const data = await r.json();
    const parts =
      data &&
      data.candidates &&
      data.candidates[0] &&
      data.candidates[0].content &&
      data.candidates[0].content.parts;
    const out = (parts && parts.map((p) => p.text).join("")) || "(хоосон хариу)";
    return { statusCode: 200, body: JSON.stringify({ text: out }) };
  } catch (err) {
    return { statusCode: 502, body: JSON.stringify({ error: "AI алдаа: " + (err && err.message) }) };
  }
};
