// Interactive VN engine that loads story.json if present, else fallback to built-in data.

const STORY_FILE = "story.json"; // if present in the repo, it will be loaded

// DOM
const background = document.getElementById("background");
const hotspotsEl = document.getElementById("hotspots");
const portrait = document.getElementById("portrait");
const namebox = document.getElementById("namebox");
const textEl = document.getElementById("text");
const choicesEl = document.getElementById("choices");
const saveBtn = document.getElementById("saveBtn");
const loadBtn = document.getElementById("loadBtn");
const restartBtn = document.getElementById("restartBtn");

const hsModal = document.getElementById("hotspot-modal");
const hsName = document.getElementById("hs-name");
const hsText = document.getElementById("hs-text");
const hsChoices = document.getElementById("hs-choices");
const hsClose = document.getElementById("hs-close");

// engine state
let gameData = null;
let currentNode = null;
let flags = {};
let typing = false;
const textSpeed = 20;

// ---------- Helpers ----------
function assetPath(name) {
  return name ? `assets/${name}` : "";
}
function setBackground(bg_room.jpg) {
  background.style.backgroundImage = bg_room.jpg ? `url('${assetPath(bg_room.jpg)}')` : "none";
}
function setPortrait(img) {
  portrait.innerHTML = img ? `<img src="${assetPath(img)}" alt="portrait">` : "";
}
function applySetFlag(setFlagObj) {
  if (!setFlagObj) return;
  for (const k in setFlagObj) flags[k] = setFlagObj[k];
}

// simple typewriter
function typeText(fullText, done) {
  typing = true;
  textEl.textContent = "";
  let i = 0;
  const t = setInterval(() => {
    textEl.textContent += fullText[i++] || "";
    if (i >= fullText.length) {
      clearInterval(t);
      typing = false;
      if (done) done();
    }
  }, textSpeed);

  // clicking textbox skips
  textEl.onclick = () => {
    if (!typing) return;
    clearInterval(t);
    textEl.textContent = fullText;
    typing = false;
    if (done) done();
  };
}

// render node choices with flag checks
function renderChoices(choices = []) {
  choicesEl.innerHTML = "";
  (choices || []).forEach(choice => {
    if (choice.requiredFlag) {
      const val = flags[choice.requiredFlag];
      if (val !== choice.requiredValue) return;
    }
    const btn = document.createElement("button");
    btn.className = "choice-btn";
    btn.textContent = choice.text;
    btn.onclick = () => {
      if (choice.setFlag) applySetFlag(choice.setFlag);
      if (choice.next) goTo(choice.next);
    };
    choicesEl.appendChild(btn);
  });
}

// Create hotspot DOM elements for current node
function renderHotspots(node) {
  hotspotsEl.innerHTML = "";
  if (!node.hotspots || !Array.isArray(node.hotspots)) return;

  node.hotspots.forEach(hs => {
    const div = document.createElement("div");
    div.className = "hotspot";
    // percent coords
    div.style.left = hs.x + "%";
    div.style.top = hs.y + "%";
    div.style.width = hs.w + "%";
    div.style.height = hs.h + "%";
    div.title = hs.label || hs.id || "Hotspot";
    // label inside (optional)
    const label = document.createElement("span");
    label.textContent = hs.label || "";
    div.appendChild(label);

    div.onclick = (e) => {
      e.stopPropagation();
      handleHotspot(hs);
    };

    hotspotsEl.appendChild(div);
  });
}

// Hotspot action handler
function handleHotspot(hs) {
  if (!hs.action) return;
  const act = hs.action;

  // optionally set flags
  if (act.setFlag) applySetFlag(act.setFlag);

  if (act.type === "goto") {
    if (act.next) goTo(act.next);
    return;
  }

  if (act.type === "dialogue") {
    // open modal
    hsName.textContent = hs.label || act.name || "";
    hsText.textContent = act.text || "";
    hsChoices.innerHTML = "";
    if (act.choices && act.choices.length) {
      act.choices.forEach(c => {
        const b = document.createElement("button");
        b.className = "choice-btn";
        b.textContent = c.text;
        b.onclick = () => {
          if (c.setFlag) applySetFlag(c.setFlag);
          if (c.next) {
            hideHotspotModal();
            goTo(c.next);
          } else {
            hideHotspotModal();
          }
        };
        hsChoices.appendChild(b);
      });
    } else {
      // single 'OK' choice
      const b = document.createElement("button");
      b.className = "choice-btn";
      b.textContent = "OK";
      b.onclick = hideHotspotModal;
      hsChoices.appendChild(b);
    }
    showHotspotModal();
    return;
  }

  // other action types can be added (e.g., inventory, minigame trigger)
}

// hotspot modal controls
function showHotspotModal() {
  hsModal.classList.remove("hidden");
}
function hideHotspotModal() {
  hsModal.classList.add("hidden");
}
hsClose.onclick = hideHotspotModal;
hsModal.onclick = (e) => { if (e.target === hsModal) hideHotspotModal(); };

// goTo node
function goTo(nodeId) {
  const node = gameData.nodes[nodeId];
  if (!node) {
    console.error("Node not found:", nodeId);
    return;
  }
  currentNode = nodeId;
  applySetFlag(node.setFlag);

  // UI updates
  setBackground(node.background);
  setPortrait(node.portrait);
  namebox.textContent = node.name || "";

  typeText(node.text || "", () => {
    renderChoices(node.choices || []);
  });

  renderHotspots(node);
}

// save/load
function saveGame() {
  const save = { current: currentNode, flags };
  try {
    localStorage.setItem("vn_save", JSON.stringify(save));
    alert("Game saved.");
  } catch (e) {
    alert("Save failed.");
  }
}
function loadGame() {
  const raw = localStorage.getItem("vn_save");
  if (!raw) { alert("No save found."); return; }
  try {
    const save = JSON.parse(raw);
    flags = save.flags || {};
    goTo(save.current || gameData.start);
    alert("Game loaded.");
  } catch (e) { alert("Failed to load save."); }
}
function restart() {
  flags = {};
  hideHotspotModal();
  goTo(gameData.start);
}

// keyboard shortcuts (1..5)
document.addEventListener("keydown", e => {
  const keys = ["1","2","3","4","5"];
  const idx = keys.indexOf(e.key);
  if (idx >= 0) {
    const btn = choicesEl.children[idx];
    if (btn) btn.click();
  }
});

// wire UI buttons
saveBtn.onclick = saveGame;
loadBtn.onclick = loadGame;
restartBtn.onclick = restart;

// ---------- Load story.json (if present) ----------
async function loadStory() {
  // try to fetch external story.json
  try {
    const resp = await fetch(STORY_FILE, {cache: "no-store"});
    if (resp.ok) {
      const json = await resp.json();
      gameData = json;
      return;
    }
  } catch (e) {
    // no external file — will fallback
  }

  // fallback built-in data (a small default)
  gameData = {
    start: "wakeup",
    nodes: {
      wakeup: {
        id: "wakeup",
        name: "You",
        background: "bg_room.jpg",
        portrait: "portray_neutral.png",
        text: "This is a fallback scene. Replace story.json with your own.",
        hotspots: [
          { id: "center", label: "Center", x: 45, y: 60, w: 12, h: 12,
            action: { type: "dialogue", text: "You clicked the center.", choices: [{ text: "Continue", next: "ending" }] } }
        ],
        choices: [{ text: "Continue", next: "ending" }]
      },
      ending: {
        id: "ending",
        name: "Narrator",
        background: "bg_stage.jpg",
        portrait: "portray_smile.png",
        text: "Fallback ending. Add a story.json to replace this.",
        choices: [{ text: "Restart", next: "wakeup" }]
      }
    }
  };
}

// start engine
(async () => {
  await loadStory();
  restart();
})();
