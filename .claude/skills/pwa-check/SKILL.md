---
name: pwa-check
description: mongol-yaria-н PWA тохиргоог (manifest.webmanifest, service worker sw.js, icon-ууд, HTTPS/start_url) шалгаж, утас/компьютерт "апп болгож суулгах" боломжтой эсэхийг баталгаажуулна. Хэрэглэгч "PWA", "суулгах боломжгүй", "install", "manifest", "service worker", "офлайн ажиллахгүй", "home screen" гэх мэт асуухад ашигла.
---

# PWA шалгагч — mongol-yaria

Аппыг утас/компьютерт "апп шиг суулгах"-ын тулд дараах нөхцлүүд бүгд хангагдсан байх ёстой. Доорх жагсаалтаар дараалан шалга, дутууг засаж зөвлө.

## 1. manifest.webmanifest
- `index.html`-д `<link rel="manifest" href="manifest.webmanifest">` байгаа эсэх.
- Заавал талбарууд: `name`, `short_name`, `start_url` (`./`), `scope` (`./`), `display: standalone`, `theme_color`, `background_color`.
- `icons`: дор хаяж **192×192** ба **512×512** PNG, мөн **maskable** purpose-тэй icon байх.

## 2. Icon-ууд (`icons/` хавтас)
- `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`, `favicon-32.png` бодитоор байгаа эсэх.
- manifest доторх `src` замууд файлуудтай тааралдаж байгаа эсэх.
- `index.html`-д `<link rel="apple-touch-icon" ...>` ба theme-color meta байгаа эсэх (iOS-д чухал).

## 3. Service worker (`sw.js`)
- `app.js` дотор `navigator.serviceWorker.register('sw.js'...)` дуудагдаж байгаа эсэх.
- `APP_SHELL` жагсаалтад `./`, `./index.html`, `./styles.css`, `./app.js`, `./manifest.webmanifest`, icon-ууд багтсан эсэх.
- Кэшийн нэр (`CACHE = "mongol-yaria-v1"`) — статик файл өөрчлөгдөхөд хувилбарыг ахиулж, хуучин кэшийг `activate`-д устгадаг эсэх.

## 4. Орчны нөхцөл
- **HTTPS заавал** (service worker + install зөвхөн HTTPS дээр; localhost үл хамаарна).
- Chrome/Edge дээр DevTools → **Application → Manifest / Service Workers** дээр алдаагүй эсэх.
- Install боломжтой бол хаягийн мөрөнд **суулгах (⊕)** дүрс гарна.

## Шалгах командууд
```bash
# Бүтэц
ls icons/
# JSON хүчинтэй эсэх
python3 -c "import json;print(json.load(open('manifest.webmanifest'))['icons'])"
# Бүртгэл ба линкүүд
grep -n "serviceWorker.register\|rel=\"manifest\"\|apple-touch-icon\|theme-color" app.js index.html
```

## Түгээмэл асуудал
- **Суулгах дүрс гарахгүй** → HTTPS биш, эсвэл maskable/512 icon дутуу, эсвэл sw бүртгэгдээгүй.
- **Офлайн нээгдэхгүй** → `APP_SHELL`-д файл дутуу эсвэл `fetch` handler-гүй.
- **Шинэ хувилбар шинэчлэгдэхгүй** → `CACHE` нэрийг ахиулаагүй (ж: `v1` → `v2`).
- **iPhone дээр дүрс буруу** → `apple-touch-icon.png` дутуу/буруу хэмжээтэй.

Эцэст нь: олдсон асуудлуудыг жагсааж, засвар бүрийг тодорхой алхмаар санал болго (зөвхөн зөвшөөрснөөр засна).
