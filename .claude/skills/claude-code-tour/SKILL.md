---
name: claude-code-tour
description: Claude Code-ийн 12 шилдэг боломжийг (CLAUDE.md, subagents, custom commands, plan mode, /clear & /compact, /rewind, MCP, hooks, skills, web search, file upload, task scheduling) монгол хэлээр алхам алхмаар зааварлаж, хэрэглэгчид дасгал хийлгэх интерактив гарын авлага. Хэрэглэгч "claude code боломжууд", "эдгээр хэрэгслийг хэрхэн ашиглах", "12 features", "сургалт", "tour" гэх мэт асуухад ашигла.
---

# Claude Code — 12 шилдэг боломжийн интерактив гарын авлага

Эх сурвалж: Nate Herk, *"I Tested Every Claude Code Feature, These 12 Are the Best"* — https://youtu.be/vfWTyEreOEc

Энэ skill нь дагалдах PPT (`docs/claude-code-12-features.pptx`)-ийн интерактив хувилбар.

## Хэрхэн ажиллах вэ

1. Хэрэглэгчээс тэдний түвшинг асуу: **шинэхэн / дунд / ахисан**.
2. Дараах 12 боломжоос аль нь хэрэгтэйг асуу, эсвэл бүгдийг дарааллаар нь явуулна гэдгийг хэл.
3. Боломж тус бүрд: **(а) юу болох, (б) яаж эхлэх (команд), (в) энэ repo дээрх жишээ, (г) жижиг дасгал** өгнө.
4. Боломжтой бол энэ repo (`mongol-yaria`) дээр шууд жишээ хийж үзүүл.

## 12 боломж — товч лавлах

| # | Tier | Боломж | Команд / Байршил |
|---|------|--------|------------------|
| 1 | S | CLAUDE.md — төслийн санах ой | `/init`, `/memory`, `CLAUDE.md` |
| 2 | S | Subagents — зэрэгцээ дэд агент | `/agents`, `.claude/agents/` |
| 3 | S | Custom commands — ажлын урсгал | `.claude/commands/*.md` |
| 4 | A | Plan Mode — төлөвлөх горим | `Shift+Tab` |
| 5 | A | Context lifecycle | `/clear`, `/compact` |
| 6 | A | Rollback checkpoints | `/rewind`, `Esc Esc` |
| 7 | A | MCP — гадаад хэрэгсэл | `/mcp`, `.mcp.json` |
| 8 | A | Hooks — автомат хяналт | `.claude/settings.json` |
| 9 | A | Skills — дахин ашиглах чадвар | `.claude/skills/<нэр>/SKILL.md` |
| 10 | A | Web search & fetch | "вэбээс хайж үз" |
| 11 | A | File / image upload | drag & drop |
| 12 | A | Task scheduling & IDE | `/tasks`, IDE extension |

## Боломж тус бүрийн дэлгэрэнгүй

### 1. CLAUDE.md — Төслийн санах ой
Claude session бүрт уншдаг "үндсэн хууль". `/init`-ээр үүсгэ, дотор нь командууд (`npx serve .`), код стиль, хориглосон зүйлсээ бич. Богино байлга (20–40 мөр).
**Дасгал:** Энэ repo-д `/init` ажиллуулж, deploy команд болон Chrome-ийн зөвлөмжийг CLAUDE.md-д нэм.

### 2. Subagents — Зэрэгцээ дэд агент
Тусдаа цэвэр контексттэй агентад судалгаа/ревью даалгаж зөвхөн дүгнэлтийг авна. `/agents`.
**Дасгал:** "app.js доторх яриа таних логикийг судалж тайлбарла" гэсэн судалгааны агент үүсгэ.

### 3. Custom commands — Ажлын урсгал
`.claude/commands/deploy.md` = `/deploy`. Давтагддаг промтыг команд болгож багаар хуваалцана.
**Дасгал:** `$ARGUMENTS` авдаг энгийн `/commit-mn` команд бич.

### 4. Plan Mode — Төлөвлөх горим
`Shift+Tab`-аар орж кодыг засахгүйгээр төлөвлөгөө гаргуулна. Эрсдэлтэй өөрчлөлт бүрт эхэлж ашигла.

### 5. Context lifecycle — /clear, /compact
Сэдэв солих бүрт `/clear`, урт яриаг `/compact`-аар шахна.

### 6. Rollback checkpoints — /rewind
Prompt бүрт автомат checkpoint. `Esc Esc` эсвэл `/rewind`-ээр буцна.

### 7. MCP — Гадаад хэрэгсэл
`/mcp`-ээр серверүүдийг хар. GitHub, Postgres, Slack гэх мэт холбоно.

### 8. Hooks — Автомат хяналт
`.claude/settings.json`-д `PreToolUse`/`PostToolUse` тохируул (ж: засвар бүрийн дараа lint).

### 9. Skills — Дахин ашиглах чадвар
`.claude/skills/<нэр>/SKILL.md`. Frontmatter-т `name` + тодорхой `description`. Энэ repo-д аль хэдийн 4 skill бий — жишээ болгон харуул.

### 10. Web search & fetch
Сүүлийн үеийн мэдээллийг "вэбээс хайж үз" гэж асуу.

### 11. File / image upload
Screenshot/дизайн чирж оруулаад кодлуул эсвэл дебаг хийлгэ.

### 12. Task scheduling & IDE
Урт build/тестийг background-д тавь (`/tasks`), VS Code / JetBrains extension-оор IDE дотроо ажилла.

## Дуусгахдаа
Хэрэглэгчид нэгтгэсэн workflow-г сануул: **Тохируул → Төлөвлө → Судал → Хэрэгжүүл → Хамгаал → Цэвэрл**. Дэлгэрэнгүйг `docs/claude-code-12-features.pptx`-ээс үз гэж хэл.
