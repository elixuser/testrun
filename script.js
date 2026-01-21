let storyData = {};
let currentScene = "start";

const background = document.getElementById("background");
const dialogueText = document.getElementById("dialogue-text");
const choicesDiv = document.getElementById("choices");

// Load story
fetch("story.json")
  .then(res => res.json())
  .then(data => {
    storyData = data;
    loadScene(currentScene);
  });

function loadScene(sceneKey) {
  const scene = storyData[sceneKey];
  if (!scene) return;

  // Set background safely
  background.style.backgroundImage = `url('${scene.background}')`;

  // Set text
  dialogueText.textContent = scene.text;

  // Clear old choices
  choicesDiv.innerHTML = "";

  if (scene.choices) {
    scene.choices.forEach(choice => {
      const btn = document.createElement("button");
      btn.textContent = choice.text;
      btn.className = "choice-btn";
      btn.onclick = () => {
        currentScene = choice.next;
        loadScene(currentScene);
      };
      choicesDiv.appendChild(btn);
    });
  } else if (scene.next) {
    // Click anywhere to continue
    background.onclick = () => {
      background.onclick = null;
      currentScene = scene.next;
      loadScene(currentScene);
    };
  }
}
