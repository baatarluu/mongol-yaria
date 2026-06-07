/* ============================================================
   Монгол.яриа — браузер дээр ажилладаг яриа таниулагч
   Speech recognition: Web Speech API (mn-MN)
   Auth: localStorage (Google ашиглахгүй)
   ============================================================ */

(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const LS = {
    USERS: "mongol_yaria_users",
    SESSION: "mongol_yaria_session",
    SAVED: "mongol_yaria_saved",
    QUOTA: "mongol_yaria_quota",
  };
  const DAILY_LIMIT = 1000000;

  /* ---------------- Toast ---------------- */
  let toastTimer;
  function toast(msg) {
    const t = $("toast");
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (t.hidden = true), 2400);
  }

  /* ---------------- Auth (localStorage) ---------------- */
  let mode = "login"; // login | register

  function getUsers() {
    try { return JSON.parse(localStorage.getItem(LS.USERS)) || {}; }
    catch { return {}; }
  }
  function setUsers(u) { localStorage.setItem(LS.USERS, JSON.stringify(u)); }

  // Энгийн hash (демо зориулалттай — жинхэнэ нууцлал биш)
  function hash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) { h = (h << 5) - h + str.charCodeAt(i); h |= 0; }
    return String(h);
  }

  function currentUser() {
    return localStorage.getItem(LS.SESSION);
  }

  function showError(msg) {
    const e = $("auth-error");
    e.textContent = msg;
    e.hidden = false;
  }

  function setMode(m) {
    mode = m;
    const isLogin = m === "login";
    $("auth-title").textContent = isLogin ? "Тавтай морил" : "Шинэ бүртгэл";
    $("auth-subtitle").textContent = isLogin
      ? "Үргэлжлүүлэхийн тулд бүртгэлээрээ нэвтэрнэ үү"
      : "И-мэйл, нууц үгээ оруулж бүртгүүлнэ үү";
    $("auth-submit").textContent = isLogin ? "Нэвтрэх" : "Бүртгүүлэх";
    $("auth-toggle-text").textContent = isLogin ? "Бүртгэл байхгүй юу?" : "Бүртгэлтэй юу?";
    $("auth-toggle-btn").textContent = isLogin ? "Бүртгүүлэх" : "Нэвтрэх";
    $("auth-error").hidden = true;
  }

  function login(user) {
    localStorage.setItem(LS.SESSION, user);
    showApp();
  }

  function logout() {
    localStorage.removeItem(LS.SESSION);
    if (recognizing) stopRecognition();
    $("app").hidden = true;
    $("auth-screen").hidden = false;
  }

  /* ---------------- App init ---------------- */
  function showApp() {
    $("auth-screen").hidden = true;
    $("app").hidden = false;
    $("user-chip").textContent = currentUser() || "зочин";
    loadTranscriptState();
    renderSaved();
    renderQuota();
    updateCounters();
  }

  /* ---------------- Speech recognition ---------------- */
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;
  let recognizing = false;
  let finalText = ""; // textarea-д орсон баталгаажсан текст

  function setupRecognition() {
    if (!SR) {
      $("browser-warning").hidden = false;
      $("start-btn").disabled = true;
      return;
    }
    recognition = new SR();
    recognition.lang = "mn-MN";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      recognizing = true;
      $("status-dot").classList.add("live");
      $("status-text").textContent = "Сонсож байна…";
      $("start-btn").disabled = true;
      $("stop-btn").disabled = false;
    };

    recognition.onresult = (event) => {
      let interim = "";
      let appended = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (res.isFinal) appended += res[0].transcript;
        else interim += res[0].transcript;
      }
      if (appended) {
        const ta = $("transcript");
        const sep = ta.value && !ta.value.endsWith(" ") ? " " : "";
        ta.value += sep + appended.trim();
        finalText = ta.value;
        countQuota(appended.length);
        updateCounters();
        persistTranscript();
      }
      $("interim").textContent = interim;
    };

    recognition.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        toast("Микрофон ашиглах зөвшөөрөл олгоно уу");
      } else if (e.error === "no-speech") {
        // дуугүй — алгасна
      } else {
        toast("Алдаа: " + e.error);
      }
    };

    recognition.onend = () => {
      // continuous горимд автоматаар тасалдвал дахин асаах
      if (recognizing) {
        try { recognition.start(); } catch { /* noop */ }
      } else {
        $("status-dot").classList.remove("live");
        $("status-text").textContent = "Бэлэн";
        $("start-btn").disabled = false;
        $("stop-btn").disabled = true;
        $("interim").textContent = "";
      }
    };
  }

  function startRecognition() {
    if (!recognition) return;
    try {
      recognizing = true;
      recognition.start();
    } catch {
      // аль хэдийн ажиллаж байна
    }
  }

  function stopRecognition() {
    recognizing = false;
    if (recognition) { try { recognition.stop(); } catch {} }
  }

  /* ---------------- Counters & quota ---------------- */
  function updateCounters() {
    const text = $("transcript").value.trim();
    const words = text ? text.split(/\s+/).length : 0;
    const chars = $("transcript").value.length;
    $("word-count").textContent = words.toLocaleString();
    $("char-count").textContent = chars.toLocaleString();
    $("token-count").textContent = Math.ceil(chars / 4).toLocaleString();
  }

  function todayKey() {
    return new Date().toISOString().slice(0, 10);
  }
  function getQuota() {
    try {
      const q = JSON.parse(localStorage.getItem(LS.QUOTA));
      if (q && q.date === todayKey()) return q.used;
    } catch {}
    return 0;
  }
  function countQuota(n) {
    const used = getQuota() + n;
    localStorage.setItem(LS.QUOTA, JSON.stringify({ date: todayKey(), used }));
    renderQuota();
  }
  function renderQuota() {
    const used = getQuota();
    $("quota-used").textContent = used.toLocaleString();
    $("quota-fill").style.width = Math.min(100, (used / DAILY_LIMIT) * 100) + "%";
  }

  /* ---------------- Transcript persistence ---------------- */
  function persistTranscript() {
    sessionStorage.setItem("mongol_yaria_draft", $("transcript").value);
  }
  function loadTranscriptState() {
    const d = sessionStorage.getItem("mongol_yaria_draft");
    if (d) $("transcript").value = d;
  }

  /* ---------------- Saved notes ---------------- */
  function getSaved() {
    try { return JSON.parse(localStorage.getItem(LS.SAVED)) || []; }
    catch { return []; }
  }
  function setSaved(arr) { localStorage.setItem(LS.SAVED, JSON.stringify(arr)); }

  function saveNote() {
    const text = $("transcript").value.trim();
    if (!text) { toast("Хадгалах текст алга"); return; }
    const arr = getSaved();
    arr.unshift({ id: Date.now(), text, date: new Date().toLocaleString("mn-MN") });
    setSaved(arr);
    renderSaved();
    toast("Хадгаллаа ✓");
  }

  function renderSaved() {
    const arr = getSaved();
    const panel = $("saved-panel");
    const list = $("saved-list");
    if (!arr.length) { panel.hidden = true; return; }
    panel.hidden = false;
    list.innerHTML = "";
    arr.forEach((item) => {
      const el = document.createElement("div");
      el.className = "saved-item";
      const head = document.createElement("div");
      head.className = "saved-item-head";
      head.innerHTML = `<span>${item.date}</span>`;
      const del = document.createElement("button");
      del.className = "link-btn saved-item-del";
      del.textContent = "Устгах";
      del.onclick = () => { setSaved(getSaved().filter((x) => x.id !== item.id)); renderSaved(); };
      head.appendChild(del);
      const body = document.createElement("div");
      body.className = "saved-item-text";
      body.textContent = item.text;
      body.onclick = () => { $("transcript").value = item.text; finalText = item.text; updateCounters(); persistTranscript(); toast("Сэргээлээ"); window.scrollTo({ top: 0, behavior: "smooth" }); };
      body.style.cursor = "pointer";
      el.appendChild(head);
      el.appendChild(body);
      list.appendChild(el);
    });
  }

  /* ---------------- AI features ---------------- */
  const AI_PROMPTS = {
    correct: "Дараах монгол текстийн зөв бичгийн болон дүрмийн алдааг засаж, гаралтыг зөвхөн засварласан текст хэлбэрээр өг:",
    summarize: "Дараах монгол текстийг товч, тодорхой хураангуйл:",
    "translate-en": "Translate the following Mongolian text to natural English. Output only the translation:",
    "translate-ja": "次のモンゴル語のテキストを自然な日本語に翻訳してください。翻訳のみを出力:",
    "translate-zh": "请将以下蒙古语文本翻译成自然流畅的中文。只输出译文:",
  };
  const AI_TITLES = {
    correct: "✍️ Засварласан текст",
    summarize: "📝 Хураангуй",
    "translate-en": "🇬🇧 Англи орчуулга",
    "translate-ja": "🇯🇵 Япон орчуулга",
    "translate-zh": "🇨🇳 Хятад орчуулга",
  };

  async function runAI(action) {
    const text = $("transcript").value.trim();
    if (!text) { toast("Эхлээд текст оруулна уу"); return; }

    const wrap = $("ai-result-wrap");
    const result = $("ai-result");
    wrap.hidden = false;
    $("ai-result-title").textContent = AI_TITLES[action] || "Үр дүн";
    result.classList.add("loading");
    result.textContent = "Боловсруулж байна…";
    wrap.scrollIntoView({ behavior: "smooth", block: "nearest" });

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: AI_PROMPTS[action], text }),
      });
      const data = await res.json();
      result.classList.remove("loading");
      if (!res.ok) {
        result.textContent =
          (data && data.error) ||
          "AI үйлчилгээ тохируулагдаагүй байна. Deploy хийсэн платформ дээрээ GEMINI_API_KEY орчны хувьсагч нэмнэ үү.";
        return;
      }
      result.textContent = data.text || "(хоосон хариу)";
    } catch (err) {
      result.classList.remove("loading");
      result.textContent = "Сүлжээний алдаа. Дахин оролдоно уу.";
    }
  }

  /* ---------------- Clipboard ---------------- */
  async function copyText(text) {
    if (!text) { toast("Хуулах текст алга"); return; }
    try { await navigator.clipboard.writeText(text); toast("Хууллаа 📋"); }
    catch { toast("Хуулж чадсангүй"); }
  }

  /* ---------------- Event wiring ---------------- */
  document.addEventListener("DOMContentLoaded", () => {
    setupRecognition();

    // Auth
    setMode("login");
    $("auth-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const email = $("email").value.trim().toLowerCase();
      const pw = $("password").value;
      if (!email || pw.length < 4) { showError("И-мэйл болон 4+ тэмдэгт нууц үг оруулна уу"); return; }
      const users = getUsers();
      if (mode === "register") {
        if (users[email]) { showError("Энэ и-мэйл аль хэдийн бүртгэлтэй байна"); return; }
        users[email] = hash(pw);
        setUsers(users);
        login(email);
        toast("Бүртгэл амжилттай ✓");
      } else {
        if (!users[email] || users[email] !== hash(pw)) { showError("И-мэйл эсвэл нууц үг буруу байна"); return; }
        login(email);
      }
    });
    $("auth-toggle-btn").addEventListener("click", () => setMode(mode === "login" ? "register" : "login"));
    $("guest-btn").addEventListener("click", () => login("зочин"));
    $("logout-btn").addEventListener("click", logout);

    // Recorder
    $("start-btn").addEventListener("click", startRecognition);
    $("stop-btn").addEventListener("click", stopRecognition);
    $("transcript").addEventListener("input", () => { updateCounters(); persistTranscript(); });
    $("copy-btn").addEventListener("click", () => copyText($("transcript").value));
    $("save-btn").addEventListener("click", saveNote);
    $("clear-btn").addEventListener("click", () => {
      if (!$("transcript").value || confirm("Текстийг устгах уу?")) {
        $("transcript").value = ""; finalText = ""; updateCounters(); persistTranscript();
      }
    });

    // AI
    document.querySelectorAll(".btn-ai").forEach((b) =>
      b.addEventListener("click", () => runAI(b.dataset.action))
    );
    $("ai-copy-btn").addEventListener("click", () => copyText($("ai-result").textContent));

    // Auto-login if session exists
    if (currentUser()) showApp();
  });

  /* ---------------- PWA: Service worker бүртгэх (офлайн дэмжлэг) ---------------- */
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => { /* офлайн дэмжлэггүй — алгасна */ });
    });
  }
})();
