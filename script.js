// Interactive VN engine (robust defaults, improved contrast & layout)

// Config
const STORY_FILE = "story.json";
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

// Helpers
function assetPath(filename){
  // if user provided nested path (backgrounds/foo.svg) keep as-is, otherwise prefix assets/
  if (!filename) return "";
  return filename.includes("/") ? `assets/${filename}` : `assets/${filename}`;
}

function setBackground(img){
  if (!img) {
    bgEl.style.backgroundImage = "none";
    return;
  }
  bgEl.style.backgroundImage = `url('${assetPath(img)}')`;
}

function setPortrait(img){
  if (!img) {
    portraitEl.innerHTML = "";
    return;
  }
  portraitEl.innerHTML = `<img src="${assetPath(img)}" alt="portrait">`;
}

function applyFlags(obj){
  if (!obj) return;
  Object.keys(obj).forEach(k => flags[k] = obj[k]);
}

// Typewriter (safe: clicking textbox completes)
function typeText(full, done){
  typing = true;
  textEl.textContent = "";
  let i = 0;
  const t = setInterval(() => {
    textEl.textContent += full.charAt(i++);
    if (i >= full.length) { clearInterval(t); typing = false; if (done) done(); }
  }, textSpeed);

  textboxEl.onclick = () => {
    if (!typing) return;
    clearInterval(t);
    textEl.textContent = full;
    typing = false;
    if (done) done();
  };
}

// Render choices
function renderChoices(choices = []){
  choicesEl.innerHTML = "";
  (choices || []).forEach(c => {
    // conditional display
    if (c.requiredFlag) {
      const val = flags[c.requiredFlag];
      if (val !== c.requiredValue) return; // skip choice
    }
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

// Hotspots
function renderHotspots(node){
  hotspotsEl.innerHTML = "";
  if (!node.hotspots || !Array.isArray(node.hotspots)) return;

  node.hotspots.forEach(hs => {
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

function handleHotspot(hs){
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
function showHotspotModal(){ hsModal.classList.remove("hidden"); }
function hideHotspotModal(){ hsModal.classList.add("hidden"); }
hsClose.onclick = hideHotspotModal;
hsModal.onclick = (e) => { if (e.target === hsModal) hideHotspotModal(); };

// Navigation
function goTo(nodeId){
  const node = gameData.nodes[nodeId];
  if (!node) { console.error("Unknown node:", nodeId); return; }
  currentNode = nodeId;
  if (node.setFlag) applyFlags(node.setFlag);

  setBackground(node.background);
  setPortrait(node.portrait);
  nameEl.textContent = node.name || "";

  typeText(node.text || "", () => {
    renderChoices(node.choices || []);
  });

  renderHotspots(node);
}

// Save/load
function saveGame(){
  const save = { current: currentNode, flags };
  try {
    localStorage.setItem("vn_save", JSON.stringify(save));
    alert("Saved.");
  } catch (e) {
    alert("Save failed.");
  }
}
function loadGame(){
  const raw = localStorage.getItem("vn_save");
  if (!raw) { alert("No save."); return; }
  try {
    const s = JSON.parse(raw);
    flags = s.flags || {};
    goTo(s.current || gameData.start);
    alert("Loaded.");
  } catch (e) { alert("Load failed."); }
}
function restart(){
  flags = {};
  hideHotspotModal();
  goTo(gameData.start);
}

// UI wiring
saveBtn.onclick = saveGame;
loadBtn.onclick = loadGame;
restartBtn.onclick = restart;

// Keyboard shortcuts for choices (1..5)
document.addEventListener("keydown", e => {
  const keys = ["1","2","3","4","5"];
  const idx = keys.indexOf(e.key);
  if (idx >= 0) {
    const btn = choicesEl.children[idx];
    if (btn) btn.click();
  }
});

// Load story.json or fallback
async function loadStory(){
  try {
    const r = await fetch(STORY_FILE, { cache: "no-store" });
    if (r.ok) {
      gameData = await r.json();
      return;
    }
  } catch (e) {
    // ignore
  }

  // fallback minimal data
  gameData = {
    start: "wakeup",
    nodes: {
      wakeup: {
        id: "wakeup",
        name: "You",
        background: "backgrounds/bg_room.svg",
        portrait: "portraits/neutral.svg",
        text: "Fallback scene. Replace story.json in repo.",
        hotspots: [
          { id: "desk", label: "Desk", x:45, y:60, w:16, h:12, action: { type:"dialogue", text:"A note lies on the desk.", choices:[{text:"Read",next:"read_note"}] } }
        ],
        choices: [{ text:"Look around", next:"look_around" }]
      },
      read_note: { id:"read_note", name:"You", background:"backgrounds/bg_room.svg", portrait:"portraits/neutral.svg", text:"You read the note.", choices:[{text:"Continue", next:"wakeup"}] },
      look_around: { id:"look_around", name:"You", background:"backgrounds/bg_hall.svg", portrait:"portraits/worried.svg", text:"You look around.", choices:[{text:"Back", next:"wakeup"}] }
    }
  };
}

// start
(async () => {
  await loadStory();
  restart();
})();
