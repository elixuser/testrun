// Interactive VN engine — cutscenes + hotspots + glitch text
const STORY_FILE = "story.json";
const ASSETS_DIR = "assets"; // <-- correct folder name
const textSpeed = 18; // ms per char

// DOM
const bgEl = document.getElementById("bg");
const hotspotsEl = document.getElementById("hotspots");
const portraitEl = document.getElementById("portrait");
const nameEl = document.getElementById("namebox");
const textEl = document.getElementById("text");
const textboxEl = document.getElementById("textbox");
const choicesEl = document.getElementById("choices");

const saveBtn = document.getElementById("saveBtn");
const loadBtn = document.getElementById("loadBtn");
const restartBtn = document.getElementById("restartBtn");

const hsModal = document.getElementById("hotspot-modal");
const hsName = document.getElementById("hs-name");
const hsText = document.getElementById("hs-text");
const hsChoices = document.getElementById("hs-choices");
const hsClose = document.getElementById("hs-close");

// State
let gameData = null;
let currentNode = null;
let flags = {};
let typing = false;

let typingInterval = null;
let autoAdvanceTimer = null;
let glitchTimers = [];

// ---------- utilities ----------
function assetPath(filename) {
  if (!filename) return "";
  filename = filename.replace(/^\.\//, "");
  if (filename.startsWith(`${ASSETS_DIR}/`)) return filename;
  return `${ASSETS_DIR}/${filename}`;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Inline effect token: [[glitch:some text]]
function formatText(raw) {
  const src = String(raw || "");
  const plain = src.replace(/\[\[glitch:(.+?)\]\]/g, (_, inner) => inner);

  const htmlEscaped = escapeHtml(src)
    .replace(/\[\[glitch:(.+?)\]\]/g, (_, inner) => {
      const safe = escapeHtml(inner);
      return `<span class="glitch" data-base="${safe}">${safe}</span>`;
    })
    .replace(/\n/g, "<br>");

  return { plain, html: htmlEscaped };
}

function clearTimers() {
  if (typingInterval) clearInterval(typingInterval);
  typingInterval = null;

  if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer);
  autoAdvanceTimer = null;

  glitchTimers.forEach(t => clearInterval(t));
  glitchTimers = [];
}

function setBackground(img) {
  if (!img) {
    bgEl.style.backgroundImage = "none";
    return;
  }
  bgEl.style.backgroundImage = `url('${assetPath(img)}')`;
}

function setPortrait(img) {
  portraitEl.innerHTML = "";
  if (!img) return;

  const el = document.createElement("img");
  el.src = assetPath(img);
  el.alt = "portrait";
  el.onerror = () => { portraitEl.innerHTML = ""; };
  portraitEl.appendChild(el);
}

function applyFlags(obj) {
  if (!obj) return;
  Object.keys(obj).forEach(k => (flags[k] = obj[k]));
}

// ---------- glitch effect ----------
function startGlitchEffects() {
  const glitchEls = textEl.querySelectorAll(".glitch");
  glitchEls.forEach(el => {
    const base = el.getAttribute("data-base") || el.textContent || "";
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*_-+=~?";

    const scramble = (s) => {
      const arr = s.split("");
      return arr.map(ch => {
        if (ch === " " || Math.random() < 0.55) return ch;
        return chars[Math.floor(Math.random() * chars.length)];
      }).join("");
    };

    let tick = 0;
    const timer = setInterval(() => {
      tick++;
      if (tick % 9 === 0) el.innerHTML = base;
      else el.innerHTML = scramble(base);
    }, 70);

    glitchTimers.push(timer);
  });
}

// ---------- typewriter ----------
function typeText(raw, done) {
  clearTimers();
  typing = true;

  const { plain, html } = formatText(raw);
  textEl.textContent = "";
  choicesEl.innerHTML = "";

  let i = 0;
  typingInterval = setInterval(() => {
    textEl.textContent += plain.charAt(i++);
    if (i >= plain.length) {
      clearInterval(typingInterval);
      typingInterval = null;
      typing = false;

      textEl.innerHTML = html;
      startGlitchEffects();
      if (done) done();
    }
  }, textSpeed);

  textboxEl.onclick = () => {
    if (!typing) return;
    clearInterval(typingInterval);
    typingInterval = null;
    typing = false;

    textEl.innerHTML = html;
    startGlitchEffects();
    if (done) done();
  };
}

// ---------- choices ----------
function choiceVisible(c) {
  if (c.requiredFlag) {
    const val = flags[c.requiredFlag];
    if (val !== c.requiredValue) return false;
  }
  return true;
}

function renderChoices(choices = []) {
  choicesEl.innerHTML = "";
  (choices || []).forEach(c => {
    if (!choiceVisible(c)) return;

    const btn = document.createElement("button");
    btn.className = "choice-btn";
    btn.textContent = c.text || "Choice";

    btn.onclick = () => {
      if (c.setFlag) applyFlags(c.setFlag);
      if (c.next) goTo(c.next);
    };

    choicesEl.appendChild(btn);
  });
}

// ---------- hotspots ----------
function renderHotspots(node) {
  hotspotsEl.innerHTML = "";
  if (!node.hotspots || !Array.isArray(node.hotspots)) return;

  node.hotspots.forEach(hs => {
    if (hs.requiredFlag) {
      const val = flags[hs.requiredFlag];
      if (val !== hs.requiredValue) return;
    }

    const el = document.createElement("div");
    el.className = "hotspot";
    el.style.left = hs.x + "%";
    el.style.top = hs.y + "%";
    el.style.width = hs.w + "%";
    el.style.height = hs.h + "%";
    el.title = hs.label || hs.id || "Hotspot";
    el.innerHTML = `<span>${hs.label || ""}</span>`;
    el.onclick = (e) => { e.stopPropagation(); handleHotspot(hs); };

    hotspotsEl.appendChild(el);
  });
}

function handleHotspot(hs) {
  if (!hs || !hs.action) return;
  const a = hs.action;

  if (a.setFlag) applyFlags(a.setFlag);

  if (a.type === "goto") {
    if (a.next) goTo(a.next);
    return;
  }

  if (a.type === "dialogue") {
    hsName.textContent = hs.label || a.name || "";
    hsText.textContent = a.text || "";
    hsChoices.innerHTML = "";

    if (a.choices && a.choices.length) {
      a.choices.forEach(c => {
        if (!choiceVisible(c)) return;

        const b = document.createElement("button");
        b.className = "choice-btn";
        b.textContent = c.text;

        b.onclick = () => {
          if (c.setFlag) applyFlags(c.setFlag);
          if (c.next) { hideHotspotModal(); goTo(c.next); }
          else hideHotspotModal();
        };

        hsChoices.appendChild(b);
      });
    } else {
      const b = document.createElement("button");
      b.className = "choice-btn";
      b.textContent = "OK";
      b.onclick = hideHotspotModal;
      hsChoices.appendChild(b);
    }

    showHotspotModal();
  }
}

// Modal helpers
function showHotspotModal() { hsModal.classList.remove("hidden"); }
function hideHotspotModal() { hsModal.classList.add("hidden"); }
hsClose.onclick = hideHotspotModal;
hsModal.onclick = (e) => { if (e.target === hsModal) hideHotspotModal(); };

// Cutscene mode
function setCutsceneMode(isCutscene) {
  document.body.classList.toggle("cutscene", !!isCutscene);
}

// ---------- navigation ----------
function goTo(nodeId) {
  const node = gameData?.nodes?.[nodeId];
  if (!node) { console.error("Unknown node:", nodeId); return; }

  clearTimers();
  hideHotspotModal();
  currentNode = nodeId;

  if (node.setFlag) applyFlags(node.setFlag);

  setCutsceneMode(!!node.cutscene);
  setBackground(node.background);
  setPortrait(node.portrait);
  nameEl.textContent = node.name || "";

  typeText(node.text || "", () => {
    renderChoices(node.choices || []);
    if (node.autoNext) {
      const delay = Number(node.autoDelay ?? 1200);
      autoAdvanceTimer = setTimeout(() => goTo(node.autoNext), delay);
    }
  });

  renderHotspots(node);
}

// ---------- save/load ----------
function saveGame() {
  const save = { current: currentNode, flags };
  try {
    localStorage.setItem("vn_save", JSON.stringify(save));
    alert("Saved.");
  } catch {
    alert("Save failed.");
  }
}

function loadGame() {
  const raw = localStorage.getItem("vn_save");
  if (!raw) { alert("No save."); return; }
  try {
    const s = JSON.parse(raw);
    flags = s.flags || {};
    goTo(s.current || gameData.start);
    alert("Loaded.");
  } catch {
    alert("Load failed.");
  }
}

function restart() {
  flags = {};
  hideHotspotModal();
  goTo(gameData.start);
}

// UI wiring
saveBtn.onclick = saveGame;
loadBtn.onclick = loadGame;
restartBtn.onclick = restart;

// Keyboard shortcuts
document.addEventListener("keydown", e => {
  const keys = ["1","2","3","4","5"];
  const idx = keys.indexOf(e.key);
  if (idx >= 0) {
    const btn = choicesEl.children[idx];
    if (btn) btn.click();
  }
});

// ---------- load story ----------
async function loadStory() {
  const r = await fetch(STORY_FILE, { cache: "no-store" });
  gameData = await r.json();
}
// =======================
// Hotspot Calibration Mode (press H)
// - Shows mouse X/Y in %
// - Click+drag draws a rectangle and logs JSON coords to console
// =======================
let hsDebugEnabled = false;
let hsDrag = null;

// Create debug UI elements
const hsDebugBox = document.createElement("div");
hsDebugBox.id = "hs-debug";
hsDebugBox.innerHTML = `
  <strong>Hotspot Debug (H to toggle)</strong>
  <div>Move mouse: <span id="hs-debug-pos">x: -, y: -</span></div>
  <div>Drag to box: <span id="hs-debug-box">x: -, y: -, w: -, h: -</span></div>
  <div style="opacity:.85;margin-top:6px;">Tip: Open Console to copy JSON</div>
`;
document.body.appendChild(hsDebugBox);

const hsRect = document.createElement("div");
hsRect.id = "hs-debug-rect";
hotspotsEl.appendChild(hsRect);

// Helper: percent coords relative to #scene (same base as hotspots)
function getScenePercent(e) {
  const scene = document.getElementById("scene");
  const r = scene.getBoundingClientRect();

  const x = ((e.clientX - r.left) / r.width) * 100;
  const y = ((e.clientY - r.top) / r.height) * 100;

  // clamp 0..100
  const cx = Math.max(0, Math.min(100, x));
  const cy = Math.max(0, Math.min(100, y));
  return { x: cx, y: cy, rect: r };
}

function setDebugVisible(on) {
  hsDebugEnabled = on;
  hsDebugBox.style.display = on ? "block" : "none";
  hsRect.style.display = "none";
  hsDrag = null;
}

// Toggle with H
document.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "h") {
    setDebugVisible(!hsDebugEnabled);
  }
});

// Update mouse position display
document.addEventListener("mousemove", (e) => {
  if (!hsDebugEnabled) return;
  const { x, y } = getScenePercent(e);
  const posEl = document.getElementById("hs-debug-pos");
  posEl.textContent = `x: ${x.toFixed(2)}%, y: ${y.toFixed(2)}%`;

  // If dragging, update rectangle
  if (hsDrag) {
    const x1 = hsDrag.startX;
    const y1 = hsDrag.startY;
    const x2 = x;
    const y2 = y;

    const left = Math.min(x1, x2);
    const top = Math.min(y1, y2);
    const w = Math.abs(x2 - x1);
    const h = Math.abs(y2 - y1);

    hsRect.style.display = "block";
    hsRect.style.left = left + "%";
    hsRect.style.top = top + "%";
    hsRect.style.width = w + "%";
    hsRect.style.height = h + "%";

    const boxEl = document.getElementById("hs-debug-box");
    boxEl.textContent = `x: ${left.toFixed(2)}%, y: ${top.toFixed(2)}%, w: ${w.toFixed(2)}%, h: ${h.toFixed(2)}%`;
  }
});

// Start drag on mousedown
document.addEventListener("mousedown", (e) => {
  if (!hsDebugEnabled) return;

  // Ignore dragging if you click inside modal or controls
  if (hsModal && !hsModal.classList.contains("hidden")) return;
  const target = e.target;
  if (target.closest("#controls") || target.closest("#choices") || target.closest("#hotspot-modal")) return;

  const { x, y } = getScenePercent(e);
  hsDrag = { startX: x, startY: y };
});

// End drag on mouseup -> print JSON coords
document.addEventListener("mouseup", (e) => {
  if (!hsDebugEnabled || !hsDrag) return;

  const { x, y } = getScenePercent(e);

  const left = Math.min(hsDrag.startX, x);
  const top = Math.min(hsDrag.startY, y);
  const w = Math.abs(x - hsDrag.startX);
  const h = Math.abs(y - hsDrag.startY);

  hsDrag = null;

  // Hide rect after logging (optional)
  hsRect.style.display = "none";

  const hotspotJson = {
    x: Number(left.toFixed(2)),
    y: Number(top.toFixed(2)),
    w: Number(w.toFixed(2)),
    h: Number(h.toFixed(2))
  };

  console.log("HOTSPOT:", hotspotJson);
  console.log("Paste into story.json:", `"x": ${hotspotJson.x}, "y": ${hotspotJson.y}, "w": ${hotspotJson.w}, "h": ${hotspotJson.h}`);
});

// Start
(async () => {
  await loadStory();
  restart();
})();
