// Interactive VN engine — cutscenes + hotspots + glitch text + click-to-continue (paging)

const STORY_FILE = "story.json";
const ASSETS_DIR = "assets";
const textSpeed = 35; // ms per char

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

  if (autoAdvanceTimer) clearTimeout(auto
