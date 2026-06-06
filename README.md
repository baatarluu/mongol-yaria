# 🎙️ Монгол.яриа — Монгол яриа таниулагч

Монгол хэлээр ярьсан яриаг **браузер дээр шууд** текст болгон хөрвүүлдэг үнэгүй веб апп.
Дээр нь AI туслахаар текстээ **засварлах, хураангуйлах, орчуулах** (Англи / Япон / Хятад) боломжтой.

> [mongol.guru](https://www.mongol.guru/) сайтаас санаа авч хийсэн, дизайн болон үндсэн боломжуудыг нь дуурайлган бүтээв.

## ✨ Боломжууд

- 🎤 **Бодит цагийн яриа таних** — браузерын Web Speech API (`mn-MN`), сервер шаардахгүй
- 🔐 **Нэвтрэлт (Google ШААРДАХГҮЙ)** — и-мэйл/нууц үг эсвэл зочин горим, бүх дата зөвхөн таны төхөөрөмжид
- 📊 Үг / тэмдэгт / токен тоолуур ба өдрийн ашиглалтын хязгаар
- 💾 Тэмдэглэл хадгалах, хуулах, устгах
- 🤖 AI туслах — **Google Gemini API**-аар засвар, хураангуй, олон хэлний орчуулга

## 🚀 Орон нутагт ажиллуулах

```bash
npx serve .
```

Браузераар нээж, микрофоны зөвшөөрөл өгнө үү. **Google Chrome ашиглахыг зөвлөнө** (Web Speech API-г хамгийн сайн дэмждэг).

## 🔑 GEMINI_API_KEY (AI туслахад)

AI туслах ажиллахын тулд [aistudio.google.com/apikey](https://aistudio.google.com/apikey) дээрээс
**үнэгүй** Gemini API key авна. Үүнийг deploy хийсэн платформынхаа Environment Variables дээр
`GEMINI_API_KEY` нэрээр нэмнэ. (Түлхүүргүй үед яриа таних боломж хэвийн ажиллах ба зөвхөн
AI товчнууд анхааруулга өгнө.)

## ☁️ Deploy — Vercel эсвэл Netlify

Аппыг **аль алинд нь** ижил кодоор байршуулж болно. AI функц нь хоёр платформ дээр аль алинд нь
`/api/ai` замаар ажиллахаар тохируулагдсан.

### Netlify дээр

1. [netlify.com](https://netlify.com) → GitHub-аар нэвтэрнэ.
2. **Add new site → Import an existing project** → GitHub repo сонгоно.
3. Тохиргоо: `netlify.toml` файл бүгдийг автоматаар тохируулна — шууд **Deploy**.
4. AI идэвхжүүлэх: **Site settings → Environment variables** дээр `GEMINI_API_KEY` нэмж дахин deploy.

> Эсвэл [Netlify Drop](https://app.netlify.com/drop)-д хавтсыг чирж шууд байршуулж болно
> (гэхдээ AI функц ажиллахын тулд GitHub-аар импорт хийх нь дээр).

### Vercel дээр

1. [vercel.com](https://vercel.com) → GitHub-аар нэвтэрнэ.
2. **Add New → Project** → GitHub repo сонгоно → Framework: **Other** → **Deploy**.
3. AI идэвхжүүлэх: **Settings → Environment Variables** дээр `GEMINI_API_KEY` нэмж дахин deploy.

## 📁 Бүтэц

```
mongol-stt/
├── index.html               # UI
├── styles.css               # Дизайн
├── app.js                   # Яриа таних + нэвтрэлт + логик
├── api/ai.js                # Vercel serverless функц (Gemini)
├── netlify/functions/ai.js  # Netlify serverless функц (Gemini)
├── netlify.toml             # Netlify тохиргоо + /api/ai redirect
├── vercel.json              # Vercel header тохиргоо
└── package.json
```

## ⚠️ Тэмдэглэл

- Яриа таних чанар браузер болон микрофоноос хамаарна. Chrome дээр хамгийн сайн.
- Нэвтрэлт нь **демо зориулалттай** (localStorage). Production-д жинхэнэ backend auth хэрэглэнэ үү.
- Gemini загварыг (`gemini-2.0-flash`) функцийн файлуудаас өөрчилж болно.

## 📄 Лиценз

MIT
