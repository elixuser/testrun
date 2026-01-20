const gameState = {
    chapter: 1,
    choices: 0,
    time: 'Morning',
    scene: 'start',
    inventory: ['Rusty Dagger']
};

const scenes = {
    start: {
        text: 'You awaken in a dark stone chamber. Three paths lie before you.',
        image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176',
        choices: [
            { text: 'Explore the tunnel', next: 'tunnel' },
            { text: 'Climb the stairs', next: 'stairs' }
        ]
    },
    tunnel: {
        text: 'The tunnel is cold and damp. You hear water dripping.',
        image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5',
        choices: [
            { text: 'Return to chamber', next: 'start' }
        ]
    },
    stairs: {
        text: 'You climb into a ruined tower overlooking a city.',
        image: 'https://images.unsplash.com/photo-1533134486753-c833f0ed4866',
        choices: [
            { text: 'Return to chamber', next: 'start' }
        ]
    }
};

/* DOM */
const sceneText = document.getElementById('scene-text');
const sceneImage = document.getElementById('scene-image');
const choicesContainer = document.getElementById('choices-container');
const inventoryItems = document.getElementById('inventory-items');

const chapterCounter = document.getElementById('chapter-counter');
const choiceCounter = document.getElementById('choice-counter');
const timeDisplay = document.getElementById('time-display');

/* INIT */
function init() {
    loadGame();
    render();
}

/* RENDER */
function render() {
    const scene = scenes[gameState.scene];

    sceneText.textContent = scene.text;
    sceneImage.style.backgroundImage = `url('${scene.image}')`;

    choicesContainer.innerHTML = '';
    scene.choices.forEach(choice => {
        const btn = document.createElement('button');
        btn.textContent = choice.text;
        btn.onclick = () => makeChoice(choice.next);
        choicesContainer.appendChild(btn);
    });

    inventoryItems.innerHTML = '';
    gameState.inventory.forEach(item => {
        const div = document.createElement('div');
        div.className = 'item';
        div.textContent = item;
        inventoryItems.appendChild(div);
    });

    chapterCounter.textContent = gameState.chapter;
    choiceCounter.textContent = gameState.choices;
    timeDisplay.textContent = gameState.time;
}

/* GAMEPLAY */
function makeChoice(nextScene) {
    gameState.scene = nextScene;
    gameState.choices++;
    gameState.chapter++;
    advanceTime();
    render();
}

/* TIME */
function advanceTime() {
    const times = ['Morning', 'Afternoon', 'Evening', 'Night'];
    const i = times.indexOf(gameState.time);
    gameState.time = times[(i + 1) % times.length];
}

/* SAVE / LOAD */
function saveGame() {
    localStorage.setItem('aethelgard-save', JSON.stringify(gameState));
}

function loadGame() {
    const save = localStorage.getItem('aethelgard-save');
    if (save) Object.assign(gameState, JSON.parse(save));
}

function resetGame() {
    localStorage.removeItem('aethelgard-save');
    location.reload();
}

/* BUTTONS */
document.getElementById('save-btn').onclick = saveGame;
document.getElementById('load-btn').onclick = () => {
    loadGame();
    render();
};
document.getElementById('reset-btn').onclick = resetGame;

/* START */
window.onload = init;
