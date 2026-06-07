# 📘 Claude Code — 12 шилдэг боломж (сургалтын материал)

Энэ хавтас нь YouTube бичлэгийг шинжилж бэлдсэн **алхамчилсан PPT** болон **шууд ашиглаж болох Claude Code skill-үүд**-ийг агуулна.

> **Эх сурвалж:** Nate Herk — *"I Tested Every Claude Code Feature, These 12 Are the Best"*
> https://youtu.be/vfWTyEreOEc

## 📊 Танилцуулга (PPT)

- **`claude-code-12-features.pptx`** — 16 слайдтай, монгол хэл дээрх алхамчилсан танилцуулга.
  PowerPoint, Google Slides, Keynote дээр нээгдэнэ.
- **`build_ppt.py`** — танилцуулгыг дахин үүсгэдэг скрипт (агуулга засвал дахин ажиллуулна):

```bash
pip install python-pptx
python3 docs/build_ppt.py
```

### Слайдын бүтэц
1. Тайтл  2. Tier эрэмбэ (агуулга)  3–14. 12 боломж тус бүр (алхам + команд + зөвлөмж)
15. Энэ repo-д суулгасан skill-ууд  16. Нэгтгэсэн ажлын урсгал

### 12 боломж
**S-Tier:** CLAUDE.md · Subagents · Custom commands
**A-Tier:** Plan Mode · /clear & /compact · /rewind · MCP · Hooks · Skills · Web search & fetch · File/Image upload · Task scheduling & IDE

## 🛠️ Шууд ашиглаж болох Skill-ууд

Эдгээр нь `.claude/skills/` дотор байгаа тул Claude Code дотроос **`/нэр`** гэж шууд дуудна:

| Skill | Зориулалт |
|-------|-----------|
| `/claude-code-tour` | Дээрх 12 боломжийг монголоор зааварлах, дасгал хийлгэх интерактив гарын авлага |
| `/deploy-helper` | mongol-yaria-г Netlify/Vercel дээр `GEMINI_API_KEY`-тэй нь алхам алхмаар deploy хийх |
| `/pwa-check` | manifest, service worker, icon-уудыг шалгаж PWA суулгах боломжийг баталгаажуулах |
| `/release-notes` | git log-оос монголоор товч release notes / changelog үүсгэх |

> 💡 Skill бүр өөрөө "хэзээ ажиллахаа" `description`-дээ тодорхойлсон тул Claude тохирох үед нь автоматаар санал болгоно (progressive disclosure).
