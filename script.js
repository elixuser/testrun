// Interactive VN engine — cutscenes + hotspots + glitch text + click-to-continue (paging)

const STORY_FILE = "story.json";
const ASSETS_DIR = "assets";
const textSpeed = 35; // ms per char

// === Glitch tuning (HARD STOP after 3 seconds) ===
const GLITCH_DURATION_MS = 3000; // <- 3 seconds
const GLITCH_TICK_MS = 70;
const GLITCH_SCRAMBLE_PROB = 0.45;

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

const continueEl = document.getElementById("continue-indicator");

// Paging state
let pages = [];
let pageIndex = 0;

// Game state
let gameData = null;
let currentNode = null;
let flags = {};
let typing = false;

let typingInterval = null;
let autoAdvanceTimer = null;

// Glitch interval tracking
let glitchIntervals = [];
let glitchState = new WeakMap(); // element -> intervalId

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
  // typing
  if (typingInterval) clearInterval(typingInterval);
  typingInterval = null;

  // cutscene auto-next
  if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer);
  autoAdvanceTimer = null;

  // glitch intervals
  glitchIntervals.forEach(id => clearInterval(id));
  glitchIntervals = [];
  glitchState = new WeakMap();
}

function setContinueVisible(on) {
  if (!continueEl) return;
  continueEl.classList.toggle("show", !!on);
}

// Split text into pages like VN dialogue.
// Use blank lines as “click to continue”
function buildPages(text) {
  const raw = String(text || "").trim();
  if (!raw) return [""];
  return raw.split(/\n\s*\n/g);
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

// ---------- glitch effect (HARD STOP after 3 seconds) ----------
function startGlitchEffects3s() {
  const glitchEls = textEl.querySelectorAll(".glitch");
  if (!glitchEls.length) return;

  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*_-+=~?";

  const scramble = (s) => {
    const arr = s.split("");
    return arr.map(ch => {
      if (ch === " " || Math.random() > GLITCH_SCRAMBLE_PROB) return ch;
      return chars[Math.floor(Math.random() * chars.length)];
    }).join("");
  };

  glitchEls.forEach(el => {
    const base = el.getAttribute("data-base") || el.textContent || "";
    el.textContent = base;

    // If this element already had a glitch interval, stop it
    const prev = glitchState.get(el);
    if (prev) clearInterval(prev);

    const start = performance.now();

    const id = setInterval(() => {
      const elapsed = performance.now() - start;

      // HARD STOP at 3 seconds
      if (elapsed >= GLITCH_DURATION_MS) {
        clearInterval(id);
        el.textContent = base;
        glitchState.delete(el);
        return;
      }

      el.textContent = scramble(base);
    }, GLITCH_TICK_MS);

    glitchState.set(el, id);
    glitchIntervals.push(id);
  });
}

// ---------- typewriter ----------
function typeText(raw, done) {
  clearTimers();
  typing = true;
  setContinueVisible(false);

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
      startGlitchEffects3s();

      if (done) done();
    }
  }, textSpeed);
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

// ---------- click-to-continue UI ----------
function showPostTextUI() {
  const node = gameData.nodes[currentNode];

  if (pageIndex < pages.length - 1) {
    setContinueVisible(true);
    choicesEl.innerHTML = "";
    return;
  }

  if (node.choices && node.choices.length) {
    setContinueVisible(false);
    renderChoices(node.choices);
    return;
  }

  if (node.next) {
    setContinueVisible(true);
    return;
  }

  setContinueVisible(false);
}

function advance() {
  const node = gameData.nodes[currentNode];

  if (pageIndex < pages.length - 1) {
    pageIndex++;
    typeText(pages[pageIndex], showPostTextUI);
    return;
  }

  if (node.choices && node.choices.length) return;

  if (node.next) goTo(node.next);
}

// Click handler: finish typing OR advance
textboxEl.addEventListener("click", () => {
  if (typing) {
    // Finish instantly
    clearTimers();
    typing = false;

    const { html } = formatText(pages[pageIndex] || "");
    textEl.innerHTML = html;

    // Brief 3s glitch (hard stop)
    startGlitchEffects3s();

    showPostTextUI();
    return;
  }

  advance();
});

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

  pages = buildPages(node.text || "");
  pageIndex = 0;

  typeText(pages[pageIndex], () => {
    showPostTextUI();

    // Auto-advance only if: cutscene + single page + no choices
    if (node.cutscene && node.autoNext && pages.length <= 1 && !(node.choices && node.choices.length)) {
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

saveBtn.onclick = saveGame;
loadBtn.onclick = loadGame;
restartBtn.onclick = restart;

// Keyboard shortcuts for choices 1..5
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
  try {
    const r = await fetch(STORY_FILE, { cache: "no-store" });
    if (!r.ok) throw new Error(`Failed to load ${STORY_FILE}: ${r.status}`);
    gameData = await r.json();
  } catch (err) {
    console.error(err);
    gameData = {
      start: "error",
      nodes: {
        error: {
          id: "error",
          name: "Error",
          background: "",
          text: `Could not load story.json.\n\n${String(err)}`,
          choices: []
        }
      }
    };
  }
}

// Start
(async () => {
  await loadStory();
  restart();
})();
