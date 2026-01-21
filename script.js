// Simple visual novel engine

// ----- Game data (edit this) -----
const gameData = {
  start: "wakeup",
  nodes: {
    wakeup: {
      id: "wakeup",
      name: "You",
      background: "bg_room.jpg",
      portrait: "portray_neutral.png",
      text: "You wake up in a strange classroom. There's a note on the desk.",
      choices: [
        { text: "Read the note", next: "read_note" },
        { text: "Look around", next: "look_around" }
      ]
    },

    read_note: {
      id: "read_note",
      name: "You",
      background: "bg_room.jpg",
      portrait: "portray_neutral.png",
      text: "The note says: 'Trust no one.' You feel uneasy.",
      setFlag: { paranoid: true },
      choices: [
        { text: "Stand up", next: "hall" },
        { text: "Ignore note", next: "sleep" }
      ]
    },

    look_around: {
      id: "look_around",
      name: "You",
      background: "bg_room.jpg",
      portrait: "portray_smile.png",
      text: "You see posters and a locked door.",
      choices: [{ text: "Try the door", next: "locked_door" }, { text: "Read the note", next: "read_note" }]
    },

    locked_door: {
      id: "locked_door",
      name: "You",
      background: "bg_hall.jpg",
      portrait: "portray_worried.png",
      text: "The door is locked. A voice behind you says: 'You're finally awake.'",
      choices: [
        { text: "Turn around", next: "mysterious_person" }
      ]
    },

    mysterious_person: {
      id: "mysterious_person",
      name: "???:",
      background: "bg_hall.jpg",
      portrait: "portray_mystery.png",
      text: "A masked figure stands there. 'Let's play a game,' they whisper.",
      choices: [
        { text: "Agree", next: "agree_game" },
        { text: "Refuse", next: "refuse_game" }
      ]
    },

    agree_game: {
      id: "agree_game",
      name: "You",
      background: "bg_hall.jpg",
      portrait: "portray_neutral.png",
      text: "You nod. The game begins.",
      choices: [{ text: "Continue", next: "ending_good" }]
    },

    refuse_game: {
      id: "refuse_game",
      name: "You",
      background: "bg_hall.jpg",
      portrait: "portray_sad.png",
      text: "You refuse. The figure disappears. You are alone... or are you?",
      choices: [{ text: "Keep looking", next: "hall" }]
    },

    sleep: {
      id: "sleep",
      name: "You",
      background: "bg_room_dark.jpg",
      portrait: "portray_sleep.png",
      text: "You sleep again and the world fades. (Bad ending)",
      choices: [{ text: "Restart", next: "wakeup" }]
    },

    hall: {
      id: "hall",
      name: "You",
      background: "bg_hall.jpg",
      portrait: "portray_neutral.png",
      text: "A long hallway stretches ahead. There is a door with red paint.",
      choices: [
        { text: "Open red door", next: "red_room", requiredFlag: "paranoid", requiredValue: true },
        { text: "Open red door (force)", next: "red_room_force" },
        { text: "Go back", next: "wakeup" }
      ]
    },

    red_room: {
      id: "red_room",
      name: "You",
      background: "bg_red.jpg",
      portrait: "portray_shock.png",
      text: "Because you read the note earlier you were cautious... and found a hidden lever. (Secret path)",
      choices: [{ text: "Pull lever", next: "secret_end" }]
    },

    red_room_force: {
      id: "red_room_force",
      name: "You",
      background: "bg_red.jpg",
      portrait: "portray_angry.png",
      text: "You force the door open and a trap triggers. (Bad ending)",
      choices: [{ text: "Restart", next: "wakeup" }]
    },

    secret_end: {
      id: "secret_end",
      name: "Narrator",
      background: "bg_secret.jpg",
      portrait: "portray_smile.png",
      text: "You discovered a secret. Well done! (Good ending)",
      choices: [{ text: "Play again", next: "wakeup" }]
    },

    ending_good: {
      id: "ending_good",
      name: "Narrator",
      background: "bg_stage.jpg",
      portrait: "portray_smile.png",
      text: "The game ends for now — but stories continue.",
      choices: [{ text: "Play again", next: "wakeup" }]
    }
  }
};

// ----- Engine state -----
let currentNode = null;
let flags = {};
let typing = false;
const textSpeed = 25; // ms per char (lower = faster)

// ----- DOM elements -----
const background = document.getElementById("background");
const portrait = document.getElementById("portrait");
const namebox = document.getElementById("namebox");
const textEl = document.getElementById("text");
const choicesEl = document.getElementById("choices");
const saveBtn = document.getElementById("saveBtn");
const loadBtn = document.getElementById("loadBtn");
const restartBtn = document.getElementById("restartBtn");

// ----- Helpers -----
function assetPath(name) {
  // images are expected in /assets/
  return name ? `assets/${name}` : "";
}

function setBackground(img) {
  background.style.backgroundImage = img ? `url('${assetPath(img)}')` : "none";
}

function setPortrait(img) {
  portrait.innerHTML = img ? `<img src="${assetPath(img)}" alt="portrait">` : "";
}

// typewriter effect
function typeText(fullText, done) {
  typing = true;
  textEl.textContent = "";
  let i = 0;
  const t = setInterval(() => {
    textEl.textContent += fullText[i++];
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

// render choices with condition check
function renderChoices(choices = []) {
  choicesEl.innerHTML = "";
  choices.forEach(choice => {
    // condition: if choice.requiredFlag exists, show only if flag matches requiredValue (or non-null)
    if (choice.requiredFlag) {
      const val = flags[choice.requiredFlag];
      if (val !== choice.requiredValue) return; // skip choice
    }

    const btn = document.createElement("button");
    btn.className = "choice-btn";
    btn.textContent = choice.text;
    btn.onclick = () => {
      if (typing) { /* prevent choosing while text typing; could auto-skip */ }
      handleChoice(choice);
    };
    choicesEl.appendChild(btn);
  });
}

// apply flag changes
function applySetFlag(node) {
  if (!node.setFlag) return;
  for (const k in node.setFlag) flags[k] = node.setFlag[k];
}

// load/render node by id
function goTo(nodeId) {
  const node = gameData.nodes[nodeId];
  if (!node) {
    console.error("Node not found:", nodeId);
    return;
  }
  currentNode = nodeId;
  applySetFlag(node);

  // UI
  setBackground(node.background);
  setPortrait(node.portrait);
  namebox.textContent = node.name || "";

  // type text then show choices
  typeText(node.text || "", () => {
    renderChoices(node.choices || []);
  });
}

// when a choice is clicked
function handleChoice(choice) {
  if (choice.setFlag) {
    for (const k in choice.setFlag) flags[k] = choice.setFlag[k];
  }
  if (choice.next) goTo(choice.next);
}

// save/load
function saveGame() {
  const save = { current: currentNode, flags };
  localStorage.setItem("vn_save", JSON.stringify(save));
  alert("Game saved.");
}

function loadGame() {
  const raw = localStorage.getItem("vn_save");
  if (!raw) { alert("No save found."); return; }
  try {
    const save = JSON.parse(raw);
    flags = save.flags || {};
    goTo(save.current || gameData.start);
    alert("Game loaded.");
  } catch (e) {
    alert("Failed to load save.");
    console.error(e);
  }
}

// restart
function restart() {
  flags = {};
  goTo(gameData.start);
}

// wire buttons
saveBtn.onclick = saveGame;
loadBtn.onclick = loadGame;
restartBtn.onclick = restart;

// keyboard shortcuts for accessibility (1,2,3 to choose first/second/third)
document.addEventListener("keydown", e => {
  const keys = ["1","2","3","4","5"];
  const idx = keys.indexOf(e.key);
  if (idx >= 0) {
    const btn = choicesEl.children[idx];
    if (btn) btn.click();
  }
});

// start
restart();
