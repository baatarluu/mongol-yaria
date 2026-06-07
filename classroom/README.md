# 🎓 Багшийн самбар — Анги ба сурагчдын удирдлага

[ZipGrade Classes](https://www.zipgrade.com/classes/)-тэй ижил ажиллагаатай, багш нарт зориулсан **анги болон сурагчдын бүртгэл удирдах** веб апп.

- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Serverless функц (Vercel / Netlify) → **Google Sheets**-ийг өгөгдлийн сан болгон ашиглана
- **Auth:** JWT (нууц үг bcrypt-ээр хэшлэгдэнэ)
- **Demo горим:** Тохиргоо хийгээгүй үед **localStorage** дээр шууд ажиллана (Google тохиргоо шаардахгүй)

> Энэ апп нь үндсэн репозиторийн дотор `classroom/` дэд хавтаст бие даан байрлана. Үндсэн **Монгол.яриа** апп хэвээрээ үлдэнэ.

---

## ✨ Үндсэн боломжууд

| Бүлэг | Боломж |
|---|---|
| 👤 **Хэрэглэгч** | Багш бүртгүүлэх, нэвтрэх, гарах (JWT) |
| 🏫 **Анги** | Үүсгэх, нэр/хичээл/өнгө засах, устгах (холбоотой сурагч/шалгалт cascade устана). Анги бүр дээр сурагчийн тоо, шалгалтын тоо харагдана |
| 👨‍🎓 **Сурагч** | Нэмэх, засах, хасах, **CSV/Excel-ээс импорт**, CSV болгон экспорт |
| 🔍 **Хайлт/Шүүлт** | Нэр, ID, и-мэйлээр шууд хайх (debounce) |
| 📝 **Шалгалт** | Анги бүрт шалгалт нэмэх, жагсаах |
| 📊 **Dashboard** | Эрх авсан багш зөвхөн өөрийн нийт анги/сурагч/шалгалтын тоймыг харна |

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
│ firstName│ lastName      │  │ totalQuestions │ createdAt      │
│ email    │ createdAt     │  └──────────┴──────────────────────┘
└──────────┴───────────────┘
```

**Хамаарал (Relationships):**
- `Teacher 1 — N Classes` (багш олон ангитай)
- `Class 1 — N Students` (анги олон сурагчтай)
- `Class 1 — N Exams` (анги олон шалгалттай)
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
│   ├── components/
│   │   ├── ui.jsx              # Modal, Spinner, EmptyState, Alert
│   │   ├── Layout.jsx          # Толгой + навигаци
│   │   └── ImportStudents.jsx  # CSV/Excel импортын цонх
│   └── pages/
│       ├── Login.jsx / Register.jsx
│       ├── Dashboard.jsx       # Хяналтын самбар
│       ├── Classes.jsx         # Анги CRUD
│       └── ClassDetail.jsx     # Сурагч + шалгалтын удирдлага
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

### Netlify
1. [netlify.com](https://netlify.com) → repo импорт.
2. **Base directory:** `classroom` (netlify.toml бусдыг автоматаар тохируулна).
3. **Site settings → Environment variables**-д дээрх env-үүдийг нэм → дахин deploy.

### Vercel
1. [vercel.com](https://vercel.com) → repo импорт → **Root Directory: `classroom`**.
2. **Settings → Environment Variables**-д env-үүдийг нэм → deploy.

---

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
