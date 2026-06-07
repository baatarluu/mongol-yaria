# 🎓 Багшийн самбар — Анги ба сурагчдын удирдлага

[ZipGrade Classes](https://www.zipgrade.com/classes/)-тэй ижил ажиллагаатай, багш нарт зориулсан **анги болон сурагчдын бүртгэл удирдах** веб апп.

- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Serverless функц (Vercel / Netlify) → **Google Sheets**-ийг өгөгдлийн сан болгон ашиглана
- **Auth:** JWT (нууц үг bcrypt-ээр хэшлэгдэнэ)
- **Demo горим:** Тохиргоо хийгээгүй үед **localStorage** дээр шууд ажиллана (Google тохиргоо шаардахгүй)
- **PWA:** Утас/компьютерт **апп болгож суулгах** боломжтой (ZipGrade-ийн утасны апп шиг), офлайн нээгдэнэ

> Энэ апп нь үндсэн репозиторийн дотор `classroom/` дэд хавтаст бие даан байрлана. Үндсэн **Монгол.яриа** апп хэвээрээ үлдэнэ.

---

## ✨ Үндсэн боломжууд

| Бүлэг | Боломж |
|---|---|
| 👤 **Хэрэглэгч** | Багш бүртгүүлэх, нэвтрэх, гарах (JWT) |
| 🏫 **Анги** | Үүсгэх, нэр/хичээл/өнгө засах, устгах (холбоотой сурагч/шалгалт cascade устана). Анги бүр дээр сурагчийн тоо, шалгалтын тоо харагдана |
| 👨‍🎓 **Сурагч** | Нэмэх, засах, хасах, **CSV/Excel-ээс импорт**, CSV болгон экспорт |
| 🔍 **Хайлт/Шүүлт** | Нэр, ID, и-мэйлээр шууд хайх (debounce) |
| 📝 **Шалгалт** | Анги бүрт шалгалт нэмэх, жагсаах, тохиргоо (асуулт/сонголт/ID орон) |
| 🔑 **Хариултын түлхүүр** | Шалгалт бүрт зөв хариултыг тохируулах |
| 🖨️ **Хариултын хуудас** | Стандарт темплэйтээр (20/25/50/100 асуулт) хуудас үүсгэж **хэвлэх** |
| 📲 **Scan / OMR** | Утасны камер эсвэл зургаар хуудсыг **уншиж автоматаар дүгнэх** |
| 📊 **Dashboard / Дүн** | Эрх авсан багш өөрийн тойм + шалгалт бүрийн дүн, дундаж оноог харна |

---

## 🗂️ Өгөгдлийн сангийн бүтэц (Database Schema)

Google Sheet доторх **tab бүр = нэг хүснэгт**, эхний мөр = баганын нэрс.

```
┌──────────────────────────────────────────────────────────────┐
│  Teachers (Багш нар)                                           │
├───────────┬──────────────────────────────────────────────────┤
│ id (PK)   │ email │ passwordHash │ name │ createdAt            │
└─────┬─────┴──────────────────────────────────────────────────┘
      │ 1
      │
      │ N
┌─────▼──────────────────────────────────────────────────────────┐
│  Classes (Ангиуд)                                                │
├──────────┬──────────────┬──────┬─────────┬───────┬──────────────┤
│ id (PK)  │ teacherId(FK)│ name │ subject │ color │ archived,... │
└────┬─────┴──────────────────────────────────────────────────────┘
     │ 1
     ├──────────────────────────┐
     │ N                        │ N
┌────▼─────────────────────┐  ┌─▼───────────────────────────────┐
│ Students (Сурагчид)       │  │ Exams (Шалгалтууд)              │
├──────────┬───────────────┤  ├──────────┬──────────────────────┤
│ id (PK)  │ classId (FK)  │  │ id (PK)  │ classId (FK)         │
│ teacherId│ studentNumber │  │ teacherId│ name │ date          │
│ firstName│ lastName      │  │ totalQuestions │ choices       │
│ email    │ createdAt     │  │ idDigits │ answerKey(JSON)      │
└──────────┴───────────────┘  └────┬─────┴──────────────────────┘
                                   │ 1
                                   │ N
                              ┌────▼───────────────────────────────┐
                              │ Results (Дүн)                       │
                              ├──────────┬──────────────────────────┤
                              │ id (PK)  │ examId (FK) │ studentId  │
                              │ studentNumber │ studentName         │
                              │ score │ total │ answers(JSON)       │
                              │ scannedAt │ classId │ teacherId     │
                              └──────────┴──────────────────────────┘
```

**Хамаарал (Relationships):**
- `Teacher 1 — N Classes` (багш олон ангитай)
- `Class 1 — N Students` (анги олон сурагчтай)
- `Class 1 — N Exams` (анги олон шалгалттай)
- `Exam 1 — N Results` (шалгалт олон сурагчийн дүнтэй; нэг сурагчийн дүн дахин уншихад шинэчлэгдэнэ)
- Бүх мөр `teacherId` агуулдаг тул багш зөвхөн **өөрийн** өгөгдлийг л харна (мөрийн түвшний эрх).

Схемийн жинхэнэ тодорхойлолт: [`server/sheets.js`](server/sheets.js) доторх `SCHEMA`.

---

## 📁 Бүтэц

```
classroom/
├── index.html                  # Vite оруулах цэг
├── src/
│   ├── main.jsx                # React root + Router + AuthProvider
│   ├── App.jsx                 # Замчлал (routes) + хамгаалагдсан зам
│   ├── index.css               # Tailwind + компонент классууд
│   ├── api/
│   │   ├── client.js           # API client (бодит/demo горим сонгогч)
│   │   └── demoStore.js        # localStorage demo backend
│   ├── auth/AuthContext.jsx    # Нэвтрэлтийн төлөв
│   ├── utils/csv.js            # CSV задлагч / экспортлогч
│   ├── omr/                    # Хариултын хуудас ба scan (OMR)
│   │   ├── layout.js           # Хуудасны геометр (хэвлэх+scan нийтлэг) + темплэйт
│   │   ├── scanner.js          # Зураг → хариулт (fiducial, homography, sampling)
│   │   └── grade.js            # Дүгнэх туслахууд
│   ├── components/
│   │   ├── ui.jsx              # Modal, Spinner, EmptyState, Alert
│   │   ├── Layout.jsx          # Толгой + навигаци
│   │   ├── ImportStudents.jsx  # CSV/Excel импортын цонх
│   │   ├── AnswerSheet.jsx     # Хариултын хуудасны SVG + хэвлэх
│   │   └── ScanModal.jsx       # Камер/зургаар уншуулах цонх
│   └── pages/
│       ├── Login.jsx / Register.jsx
│       ├── Dashboard.jsx       # Хяналтын самбар
│       ├── Classes.jsx         # Анги CRUD
│       ├── ClassDetail.jsx     # Сурагч + шалгалтын удирдлага
│       └── ExamDetail.jsx      # Түлхүүр, хуудас хэвлэх, scan, дүн
├── server/                     # Backend (бүх платформд нийтлэг)
│   ├── app.js                  # Цөм API router (framework-гүй)
│   ├── sheets.js               # Google Sheets өгөгдлийн давхарга
│   ├── auth.js                 # JWT + bcrypt
│   └── dev-server.js           # Локал API сервер
├── api/[...path].js            # Vercel adapter
├── netlify/functions/api.js    # Netlify adapter
├── netlify.toml / vercel.json  # Deploy тохиргоо
└── .env.example                # Орчны хувьсагчийн загвар
```

---

## 🚀 Локалд ажиллуулах

### 1) Demo горим (хамгийн хялбар — тохиргоо шаардахгүй)

```bash
cd classroom
npm install
npm run dev
```

`http://localhost:5174` нээгээд бүртгүүлээд шууд ашиглана. Өгөгдөл browser-ийн localStorage-д хадгалагдана.

### 2) Бодит горим (Google Sheets backend-тэй)

```bash
cd classroom
cp .env.example .env     # дараа нь .env-ээ бөглөнө (доороос үз)
npm install
npm run dev:api          # терминал 1: API сервер (http://localhost:4000)
# .env дотор VITE_USE_API=true болгоно
npm run dev              # терминал 2: Vite (/api-г 4000 руу проксидоно)
```

---

## 🔑 Google Sheets-ийг backend болгох (алхам алхмаар)

1. **Google Sheet үүсгэх** → URL-ийн `/d/<ID>/edit` хэсгээс `GOOGLE_SHEET_ID`-г ав.
2. [Google Cloud Console](https://console.cloud.google.com/) → project үүсгэ → **Google Sheets API**-г идэвхжүүл.
3. **Service Account** үүсгэ → **Keys → Add key → JSON** татаж ав.
4. JSON доторх `client_email`, `private_key`-г `.env`-д бич:
   ```
   VITE_USE_API=true
   JWT_SECRET=<урт-санамсаргүй-тэмдэгт>
   GOOGLE_SERVICE_ACCOUNT_EMAIL=...@...iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   GOOGLE_SHEET_ID=<sheet-id>
   ```
5. **Sheet-ээ Share** хий → service account-ийн `client_email` рүү **Editor** эрх өг.
6. Апп анх ажиллахдаа `Teachers`, `Classes`, `Students`, `Exams` tab-уудыг **автоматаар үүсгэнэ**.

> 💡 Багш бүр зөвхөн өөрийн өгөгдлийг л харна. Хэд хэдэн багш нэг Sheet хуваалцаж болох ба өгөгдөл `teacherId`-аар тусгаарлагдана. Sheet эзэмшигч (та) Google Sheet дотроос бүх түүхий датаг хармаар бол шууд нээж үзэж болно.

---

## ☁️ Deploy

| Платформ | Backend (Google Sheets) | Тайлбар |
|---|---|---|
| **Netlify / Vercel** | ✅ Бүрэн | Serverless функц ажиллана. **Бодит** ашиглалтад зориулсан. |
| **GitHub Pages** | ❌ (demo only) | Статик зөвхөн. localStorage demo горимоор ажиллана. Туршихад тохиромжтой. |

### GitHub Pages (автомат — demo)
Репог `main` салбар руу push хийхэд [`.github/workflows/deploy-pages.yml`](../.github/workflows/deploy-pages.yml)
автоматаар classroom-ийг build хийж байршуулна:
- Үндсэн Монгол.яриа апп: `https://<хэрэглэгч>.github.io/<repo>/`
- **Багшийн самбар:** `https://<хэрэглэгч>.github.io/<repo>/classroom/`

> GitHub Pages дээр serverless ажиллахгүй тул workflow нь `VITE_USE_API=false` (demo горим)
> ба `VITE_ROUTER=hash` (deep-link 404-аас сэргийлэх)-ээр build хийдэг. **Бодит** Google Sheets
> backend хэрэгтэй бол доорх Netlify/Vercel-ийг ашиглана уу.

### Netlify (бүрэн — backend-тэй)
1. [netlify.com](https://netlify.com) → repo импорт.
2. **Base directory:** `classroom` (netlify.toml бусдыг автоматаар тохируулна).
3. **Site settings → Environment variables**-д дээрх env-үүдийг нэм → дахин deploy.

### Vercel (бүрэн — backend-тэй)
1. [vercel.com](https://vercel.com) → repo импорт → **Root Directory: `classroom`**.
2. **Settings → Environment Variables**-д env-үүдийг нэм → deploy.

---

## 📲 Утсанд апп болгож суулгах (PWA)

Энэ апп нь **веб** хувилбар ба **утасны апп** хувилбар хоёулаа нэг кодоор ажилладаг
([Progressive Web App](https://web.dev/progressive-web-apps/)). Deploy хийсэн **HTTPS**
хаягаар нээгээд:

- **Android (Chrome):** толгой дээрх **"📲 Апп суулгах"** товч дээр дарна, эсвэл цэс (⋮) →
  **"Install app / Add to Home screen"**.
- **iPhone (Safari):** Хуваалцах товч (⬆️) → **"Add to Home Screen"**. (Апп доторх товч дарвал
  алхам алхмын зааврыг харуулна.)
- **Компьютер (Chrome/Edge):** хаягийн мөрний баруун талын **суулгах (⊕)** дүрс.

Суулгасны дараа нүүр дэлгэцэд 🎓 дүрсээр бүтэн дэлгэцийн апп шиг нээгдэх ба офлайн үед ч
нээгдэнэ (өгөгдөл шинэчлэхэд интернэт хэрэгтэй). Холбогдох файлууд:
[`public/manifest.webmanifest`](public/manifest.webmanifest),
[`public/sw.js`](public/sw.js),
[`src/pwa/install.js`](src/pwa/install.js).

> Дүрсүүдийг `python3 scripts/gen-icons.py`-аар дахин үүсгэж болно (гадны хамаарал шаардахгүй).

## 🖨️📲 Хариултын хуудас ба Scan (OMR)

ZipGrade шиг **олон сонголттой шалгалтыг** хэвлэсэн хариултын хуудсаар авч, утсаар
**уншуулж автоматаар дүгнэнэ**.

### Урсгал
1. Анги → **Шалгалт** таб → шалгалт үүсгэх (асуулт, сонголтын тоо).
2. Шалгалт нээх → **🔑 Хариултын түлхүүр** оруулах.
3. **🖨️ Хуудас хэвлэх** → A4 хуудас хэвлээд сурагчдад тараах.
4. Сурагчид **ID + хариултаа** будна.
5. **📲 Хуудас уншуулах** → утасны камер эсвэл зургаар → апп **ID + хариултыг уншиж**,
   түлхүүртэй тулгаж **оноо** гаргаад дүнг хадгална (ID-аар сурагчтай автоматаар тааруулна).

### Стандарт темплэйт ба тохируулга
Бэлэн темплэйтүүд: **20 (A–D), 25 (A–E), 50 (A–D), 100 (A–D)**. Эсвэл шалгалтын
**⚙️ Тохиргоо**-оос асуултын тоо (1–100), сонголт (2–6 = A–F), ID орон (0–8)-г чөлөөтэй
өөрчилнө. Хэвлэх хуудас ба уншигч нь **нэг л геометр** ([`src/omr/layout.js`](src/omr/layout.js))
ашигладаг тул үргэлж таарна.

### Хэрхэн ажилладаг вэ (OMR)
1. Зургийг саарал болгож **Otsu** босгоор хоёртлоно.
2. **4 булангийн ■ тэмдгийг** олж, **homography**-аар хэтийн зургийг засна (хазайсан/налуу
   зураг ч болно).
3. Бөмбөлөг бүрийн **харанхуйг** хэмжиж, бүлэг тус бүрийн хамгийн бараан, тодорхой
   ялгаатайг сонгоно. Уншигдсаныг хүн засаж болно.

Код: [`src/omr/scanner.js`](src/omr/scanner.js), [`src/omr/grade.js`](src/omr/grade.js),
[`src/components/AnswerSheet.jsx`](src/components/AnswerSheet.jsx),
[`src/components/ScanModal.jsx`](src/components/ScanModal.jsx).

> **Зөвлөмж:** тэгш гэрэлд, сүүдэргүй, 4 булангийн тэмдэг бүрэн харагдахаар, шууд дээрээс нь
> зураг ав. Камер ажиллах болон апп суулгахад **HTTPS** шаардлагатай (deploy хийсэн хаяг).
> Уншилт эргэлзээтэй бол ID болон оноог хадгалахын өмнө гараар засах боломжтой.

## 📥 CSV / Excel импортын формат

Excel-ээс **.csv** болгон хадгалаад файлаа сонгоно, эсвэл текст хуулна. Багана:

```csv
дугаар,нэр,овог,и-мэйл
001,Бат,Болд,bat@example.com
002,Сараа,Дорж,saraa@example.com
```

Толгойн мөр (`дугаар/нэр/овог/и-мэйл` эсвэл `id/first/last/email`) автоматаар танигдана. Толгойгүй бол баганын дарааллаар таамаглана. `,` `;` `Tab` бүгд дэмжигдэнэ.

## 📄 Лиценз

MIT
