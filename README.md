# 🎙️ Монгол.яриа — Монгол яриа таниулагч

Монгол хэлээр ярьсан яриаг **браузер дээр шууд** текст болгон хөрвүүлдэг үнэгүй веб апп.
Дээр нь AI туслахаар текстээ **засварлах, хураангуйлах, орчуулах** (Англи / Япон / Хятад) боломжтой.

> [mongol.guru](https://www.mongol.guru/) сайтаас санаа авч хийсэн, дизайн болон үндсэн боломжуудыг дуурайлган бүтээв.

## ✨ Боломжууд

- 🎤 **Бодит цагийн яриа таних** — браузерын Web Speech API (`mn-MN`), сервер шаардахгүй
- 🔐 **Нэвтрэлт (Google ШААРДАХГҮЙ)** — и-мэйл/нууц үг эсвэл зочин горим, бүх дата зөвхөн таны төхөөрөмжид
- 📊 Үг / тэмдэгт / токен тоолуур ба өдрийн ашиглалтын хязгаар
- 💾 Тэмдэглэл хадгалах, хуулах, устгах
- 🤖 AI туслах — Claude API-аар засвар, хураангуй, олон хэлний орчуулга

## 🚀 Орон нутагт ажиллуулах

```bash
npx serve .
# эсвэл
python -m http.server 3000
```

Браузераар нээж, микрофоны зөвшөөрөл өгнө үү. **Google Chrome ашиглахыг зөвлөнө** (Web Speech API-г хамгийн сайн дэмждэг).

## ☁️ Vercel дээр deploy хийх

### A хувилбар — GitHub-аар (хамгийн хялбар)

1. Энэ кодыг GitHub repo-д push хийнэ (доорх "GitHub" хэсгийг үз).
2. [vercel.com](https://vercel.com) → **Add New → Project** → GitHub repo-гоо сонгоно.
3. Framework: **Other** (тохиргоо хэрэггүй), **Deploy** дарна.
4. AI боломжийг идэвхжүүлэхийн тулд: **Settings → Environment Variables** дээр
   `ANTHROPIC_API_KEY` = таны Anthropic API түлхүүр нэмж, дахин deploy хийнэ.

### B хувилбар — Vercel CLI-аар

```bash
npm i -g vercel
vercel login
vercel            # урьдчилсан deploy
vercel --prod     # production deploy
vercel env add ANTHROPIC_API_KEY   # AI түлхүүр нэмэх
```

## 🔑 ANTHROPIC_API_KEY

AI туслах ажиллахын тулд [console.anthropic.com](https://console.anthropic.com/) дээрээс API key авч,
Vercel-ийн Environment Variables дээр `ANTHROPIC_API_KEY` нэрээр нэмнэ. (Түлхүүргүй үед яриа таних
боломж хэвийн ажиллах ба зөвхөн AI товчнууд анхааруулга өгнө.)

## 📁 Бүтэц

```
mongol-stt/
├── index.html        # UI
├── styles.css        # Дизайн
├── app.js            # Яриа таних + нэвтрэлт + логик
├── api/ai.js         # Vercel serverless функц (Claude API)
├── vercel.json       # Микрофон зөвшөөрлийн header
└── package.json
```

## ⚠️ Тэмдэглэл

- Яриа таних чанар браузер болон микрофоноос хамаарна. Chrome дээр хамгийн сайн.
- Нэвтрэлт нь **демо зориулалттай** (localStorage). Production-д жинхэнэ backend auth хэрэглэнэ үү.

## 📄 Лиценз

MIT
