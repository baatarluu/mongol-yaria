---
name: deploy-helper
description: mongol-yaria веб аппыг Netlify эсвэл Vercel дээр алхам алхмаар deploy хийж, GEMINI_API_KEY-г Environment Variables-д зөв тохируулахад туслана. Хэрэглэгч "deploy", "байршуулах", "Netlify", "Vercel", "AI ажиллахгүй байна", "GEMINI_API_KEY", "host хийх" гэх мэт асуухад ашигла.
---

# Deploy туслах — mongol-yaria

Энэ апп нь микрофон болон PWA суулгахын тулд **HTTPS** хаяг шаардана. Тиймээс Netlify эсвэл Vercel дээр байршуулах ёстой. AI функц нь хоёр платформ дээр `/api/ai` замаар ажиллана.

## Эхлээд шалга
- `netlify.toml` (Netlify тохиргоо + `/api/ai` redirect) — байгаа эсэх.
- `vercel.json` (Vercel header) — байгаа эсэх.
- `api/ai.js` (Vercel serverless) ба `netlify/functions/ai.js` (Netlify serverless) — хоёул байх ёстой.
- `git status` цэвэр, бүх өөрчлөлт push хийгдсэн эсэх.

## A. Netlify дээр deploy (зөвлөмж: GitHub-аар импорт)
1. https://netlify.com → GitHub-аар нэвтэр.
2. **Add new site → Import an existing project** → энэ GitHub repo-г сонго.
3. `netlify.toml` тохиргоог автоматаар уншина — шууд **Deploy**.
4. **AI идэвхжүүлэх:** Site settings → **Environment variables** → `GEMINI_API_KEY` нэмж дахин deploy.
5. Гарсан HTTPS холбоосыг нээж: микрофон зөвшөөр → яриа таних, AI товчнуудыг шалга.

> Хурдан туршихад https://app.netlify.com/drop-д хавтсыг чирж болно, гэхдээ AI ажиллахын тулд GitHub импорт хэрэгтэй.

## B. Vercel дээр deploy
1. https://vercel.com → GitHub-аар нэвтэр.
2. **Add New → Project** → repo сонго → Framework: **Other** → **Deploy**.
3. **AI идэвхжүүлэх:** Settings → **Environment Variables** → `GEMINI_API_KEY` нэмж дахин deploy.

## GEMINI_API_KEY авах
1. https://aistudio.google.com/apikey → **үнэгүй** key үүсгэ.
2. Платформынхаа Environment Variables-д `GEMINI_API_KEY` нэрээр нэм.
3. **Заавал дахин deploy** хий (env өөрчлөлт идэвхжихийн тулд).

## Эвдрэл засах (troubleshooting)
- **AI товч анхааруулга өгч байна** → `GEMINI_API_KEY` тохируулагдаагүй эсвэл дахин deploy хийгээгүй.
- **Микрофон ажиллахгүй** → HTTP дээр нээсэн (HTTPS хэрэгтэй), эсвэл Chrome биш браузер, эсвэл зөвшөөрөл өгөөгүй.
- **/api/ai 404 (Netlify)** → `netlify.toml` доторх redirect алга — файлыг шалга.
- **Загвар солих** → `api/ai.js` ба `netlify/functions/ai.js` доторх `gemini-2.0-flash`-г өөрчил (хоёуланд нь!).

## Орон нутагт туршихад
`npx serve .` → http://localhost:3000 (Chrome). Локалд **яриа таних, тэмдэглэл** ажиллана; **AI болон суулгах** нь зөвхөн HTTPS deploy дээр.
