// Robust VN engine: builtin fallback + try to load external story.json
const STORY_FILE = "story.json";
const textSpeed = 18;

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
const errorBanner = document.getElementById("error-banner");

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

// Helper to handle filenames with spaces by encoding them
function assetPath(file) {
  if (!file) return "";
  // allow file to already contain folders: e.g. "backgrounds/classroom.jpg"
  // prefix with assets/ if not already
  const path = file.startsWith("assets/") ? file : `assets/${file}`;
  // encode only the path segments after / to preserve slashes
  return path.split("/").map(encodeURIComponent).join("/");
}

function setBackground(img) {
  if (!img) { bgEl.style.backgroundImage = "none"; return; }
  bgEl.style.backgroundImage = `url('${assetPath(img)}')`;
}

function setPortrait(img) {
  if (!img) { portraitEl.innerHTML = ""; return; }
  portraitEl.innerHTML = `<img src="${assetPath(img)}" alt="portrait">`;
}

function applyFlags(obj) {
  if (!obj) return;
  Object.keys(obj).forEach(k => flags[k] = obj[k]);
}

// typewriter
function typeText(full, done) {
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

// render choices
function renderChoices(choices = []) {
  choicesEl.innerHTML = "";
  (choices || []).forEach(c => {
    if (c.requiredFlag) {
      const val = flags[c.requiredFlag];
      if (val !== c.requiredValue) return;
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

// render hotspots rectangles (percent coords)
function renderHotspots(node) {
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
        const b = document.createElement("button");
        b.className = "choice-btn";
        b.textContent = c.text;
        b.onclick = () => {
          if (c.setFlag) applyFlags(c.setFlag);
          if (c.next) { hideHotspotModal(); goTo(c.next); } else hideHotspotModal();
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

function showHotspotModal() { hsModal.classList.remove("hidden"); }
function hideHotspotModal() { hsModal.classList.add("hidden"); }
hsClose.onclick = hideHotspotModal;
hsModal.onclick = (e) => { if (e.target === hsModal) hideHotspotModal(); };

// navigation
function goTo(nodeId) {
  const node = gameData.nodes[nodeId];
  if (!node) { console.error("Missing node:", nodeId); return; }
  currentNode = nodeId;

  if (node.setFlag) applyFlags(node.setFlag);

  setBackground(node.background);
  setPortrait(node.portrait);
  nameEl.textContent = node.name || "";

  typeText(node.text || "", () => {
    renderChoices(node.choices || []);
  });

  renderHotspots(node);

  // if node defines a single auto-next (no choices) allow click anywhere to continue
  if ((!node.choices || node.choices.length === 0) && node.next) {
    bgEl.onclick = () => { bgEl.onclick = null; goTo(node.next); };
    textboxEl.onclick = () => { textboxEl.onclick = null; goTo(node.next); };
  } else {
    bgEl.onclick = null;
    textboxEl.onclick = null;
  }
}

// save/load
function saveGame() {
  try {
    const save = { current: currentNode, flags };
    localStorage.setItem("vn_save", JSON.stringify(save));
    alert("Game saved.");
  } catch (e) { alert("Save failed."); }
}
function loadGame() {
  const raw = localStorage.getItem("vn_save");
  if (!raw) { alert("No save found."); return; }
  try {
    const s = JSON.parse(raw);
    flags = s.flags || {};
    goTo(s.current || gameData.start);
    alert("Loaded.");
  } catch (e) { alert("Load failed."); }
}
function restart() {
  flags = {};
  hideHotspotModal();
  goTo(gameData.start);
}

saveBtn.onclick = saveGame;
loadBtn.onclick = loadGame;
restartBtn.onclick = restart;

// keyboard (1..5)
document.addEventListener("keydown", e => {
  const keys = ["1","2","3","4","5"];
  const idx = keys.indexOf(e.key);
  if (idx >= 0) {
    const btn = choicesEl.children[idx];
    if (btn) btn.click();
  }
});

// try to load external story.json; fallback to builtin
async function loadStory() {
  // built-in fallback storyData (uses your images by default)
  const fallback = {
    start: "wakeup",
    nodes: {
      wakeup: {
        id: "wakeup",
        name: "You",
        background: "backgrounds/classroom.jpg",
        portrait: "",
        text: "You wake up in a familiar classroom. It's quiet.",
        hotspots: [
          { id:"desk", label:"Desk", x:44, y:62, w:18, h:14, action:{ type:"dialogue", text:"A folded note sits on the desk.", choices:[{text:"Read the note", next:"read_note"},{text:"Leave it", next:"look_around"}] } },
          { id:"door", label:"Door", x:82, y:36, w:10, h:42, action:{ type:"goto", next:"locked_door" } }
        ],
        choices:[{ text:"Look around", next:"look_around" }]
      },

      read_note: {
        id:"read_note",
        name:"You",
        background:"backgrounds/classroom.jpg",
        portrait:"",
        text:"The note says: 'Trust no one.' You feel uneasy.",
        setFlag:{ paranoid:true },
        choices:[{ text:"Stand up", next:"hallway" }, { text:"Ignore note", next:"sleep" }]
      },

      look_around: {
        id:"look_around",
        name:"You",
        background:"backgrounds/classroom.jpg",
        portrait:"",
        text:"You glance at posters on the wall and the locked door.",
        choices:[{ text:"Try the door", next:"locked_door" }, { text:"Read the note", next:"read_note" }]
      },

      locked_door: {
        id:"locked_door",
        name:"You",
        background:"backgrounds/hallway.jpg",
        portrait:"",
        text:"The hallway stretches out, dim and long.",
        choices:[{ text:"Walk forward", next:"red_room" }]
      },

      red_room: {
        id:"red_room",
        name:"You",
        background:"backgrounds/red_room.jpg",
        portrait:"",
        text:"Everything is bathed in red. You sense danger.",
        choices:[{ text:"Restart", next:"wakeup" }]
      },

      sleep: {
        id:"sleep",
        name:"You",
        background:"backgrounds/classroom.jpg",
        portrait:"",
        text:"You fall asleep again... (bad ending)",
        choices:[{ text:"Restart", next:"wakeup" }]
      }
    }
  };

  try {
    const resp = await fetch(STORY_FILE, {cache: "no-store"});
    if (!resp.ok) throw new Error("Story file not found");
    const json = await resp.json();
    gameData = json;
    errorBanner.classList.add("hidden");
  } catch (e) {
    // fallback to embedded story
    gameData = fallback;
    errorBanner.classList.remove("hidden");
    errorBanner.textContent = "Notice: story.json not found or failed to load — using built-in demo. (See console for details.)";
    console.warn("Failed to load story.json — using fallback. Error:", e);
  }
}

// start
(async () => {
  await loadStory();
  restart();
})();
