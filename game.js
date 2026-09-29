/* =========================================================
   GOL-DIE: MY LITTLE AQUARIUM
   SCRIPT.JS
========================================================= */


/* =========================================================
   ELEMENTS
========================================================= */

const titleScreen = document.getElementById("titleScreen");
const gameScreen = document.getElementById("gameScreen");
const aquarium = document.getElementById("aquarium");

const startButton = document.getElementById("startButton");
const howToButton = document.getElementById("howToButton");
const settingsButton = document.getElementById("settingsButton");

const foodButton = document.getElementById("foodButton");
const cleanButton = document.getElementById("cleanButton");
const sleepButton = document.getElementById("sleepButton");

const sleepIcon = document.getElementById("sleepIcon");
const sleepText = document.getElementById("sleepText");

const goldie = document.getElementById("goldie");

const foodModal = document.getElementById("foodModal");
const howToModal = document.getElementById("howToModal");
const settingsModal = document.getElementById("settingsModal");

const particleLayer = document.getElementById("particleLayer");
const foodLayer = document.getElementById("foodLayer");

const gameMessage = document.getElementById("gameMessage");
const cleaningSponge = document.getElementById("cleaningSponge");

const clockDisplay = document.getElementById("clockDisplay");
const dayDisplay = document.getElementById("dayDisplay");

const transitionOverlay =
  document.getElementById("transitionOverlay");

const customCursor =
  document.getElementById("customCursor");

const motionToggle =
  document.getElementById("motionToggle");

const bubbleToggle =
  document.getElementById("bubbleToggle");

const resetButton =
  document.getElementById("resetButton");


/* =========================================================
   GAME STATE
========================================================= */

const DEFAULT_STATE = {
  health: 92,
  hunger: 78,
  happiness: 86,
  affection: 60,
  clean: 88,
  energy: 82,

  minutes: 8 * 60,
  day: 1
};

let state = {
  ...DEFAULT_STATE
};

let gameStarted = false;
let sleeping = false;
let cleaning = false;

let messageTimeout = null;
let activeFood = null;


/* =========================================================
   FISH MOVEMENT DATA
========================================================= */

const fish = {
  x: 0,
  y: 0,

  targetX: 0,
  targetY: 0,

  speed: 0.65,

  initialized: false
};


/* =========================================================
   FOOD TYPES
========================================================= */

const FOOD_DATA = {
  flake: {
    icon: "🌸",
    hunger: 14,
    health: 2,
    happiness: 5,
    energy: 1,
    message: "YUMMY! ♥"
  },

  shrimp: {
    icon: "🦐",
    hunger: 23,
    health: 4,
    happiness: 10,
    energy: 3,
    message: "GOL-DIE LOVES IT! ♥"
  },

  pellet: {
    icon: "🟡",
    hunger: 18,
    health: 3,
    happiness: 6,
    energy: 2,
    message: "CRUNCH CRUNCH! ♥"
  }
};


/* =========================================================
   STAT ELEMENTS
========================================================= */

const stats = {
  health: {
    bar: document.getElementById("healthBar"),
    value: document.getElementById("healthValue")
  },

  hunger: {
    bar: document.getElementById("hungerBar"),
    value: document.getElementById("hungerValue")
  },

  happiness: {
    bar: document.getElementById("happinessBar"),
    value: document.getElementById("happinessValue")
  },

  affection: {
    bar: document.getElementById("affectionBar"),
    value: document.getElementById("affectionValue")
  },

  clean: {
    bar: document.getElementById("cleanBar"),
    value: document.getElementById("cleanValue")
  },

  energy: {
    bar: document.getElementById("energyBar"),
    value: document.getElementById("energyValue")
  }
};


/* =========================================================
   HELPERS
========================================================= */

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}


function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}


function distance(x1, y1, x2, y2) {
  return Math.hypot(
    x2 - x1,
    y2 - y1
  );
}


/* =========================================================
   SAVE / LOAD
========================================================= */

function saveGame() {
  try {
    localStorage.setItem(
      "goldieSave",
      JSON.stringify(state)
    );
  } catch (error) {
    console.warn("Could not save game:", error);
  }
}


function loadGame() {
  try {
    const save =
      localStorage.getItem("goldieSave");

    if (!save) {
      return;
    }

    const parsed = JSON.parse(save);

    state = {
      ...DEFAULT_STATE,
      ...parsed
    };

    Object.keys(stats).forEach((key) => {
      state[key] =
        clamp(Number(state[key]) || 0, 0, 100);
    });

    state.day =
      Math.max(1, Number(state.day) || 1);

    state.minutes =
      clamp(
        Number(state.minutes) || 0,
        0,
        1439
      );

  } catch (error) {
    console.warn("Could not load save:", error);
  }
}


/* =========================================================
   TITLE SCREEN
========================================================= */

startButton.addEventListener("click", startGame);

howToButton.addEventListener("click", () => {
  openModal(howToModal);
});

settingsButton.addEventListener("click", () => {
  openModal(settingsModal);
});


function startGame() {

  if (gameStarted) {
    return;
  }

  gameStarted = true;

  transitionOverlay.classList.add("active");

  setTimeout(() => {
    titleScreen.classList.remove("active");
    gameScreen.classList.add("active");

    initializeFish();
    updateUI();
  }, 500);

  setTimeout(() => {
    transitionOverlay.classList.remove("active");

    showMessage("HI! I'M GOL-DIE! ♥");
  }, 1100);
}


/* =========================================================
   MODALS
========================================================= */

function openModal(modal) {
  modal.classList.add("open");
}


function closeModal(modal) {
  modal.classList.remove("open");
}


document
  .querySelectorAll("[data-close-modal]")
  .forEach((button) => {

    button.addEventListener("click", () => {
      const modalId =
        button.dataset.closeModal;

      closeModal(
        document.getElementById(modalId)
      );
    });

  });


document
  .querySelectorAll(".modal-backdrop")
  .forEach((modal) => {

    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        closeModal(modal);
      }
    });

  });


document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    document
      .querySelectorAll(".modal-backdrop.open")
      .forEach(closeModal);
  }
});


/* =========================================================
   CUSTOM CURSOR
========================================================= */

let cursorX = -100;
let cursorY = -100;

let cursorDisplayX = -100;
let cursorDisplayY = -100;


document.addEventListener(
  "pointermove",
  (event) => {

    cursorX = event.clientX;
    cursorY = event.clientY;

    const target =
      event.target.closest(
        "button, .interactive, #goldie"
      );

    customCursor.classList.toggle(
      "is-interactive",
      Boolean(target)
    );

    customCursor.classList.toggle(
      "pet-ready",
      Boolean(event.target.closest("#goldie"))
    );
  }
);


function animateCursor() {

  cursorDisplayX +=
    (cursorX - cursorDisplayX) * 0.35;

  cursorDisplayY +=
    (cursorY - cursorDisplayY) * 0.35;

  customCursor.style.transform =
    `translate3d(
      ${cursorDisplayX - 9}px,
      ${cursorDisplayY - 7}px,
      0
    )`;

  requestAnimationFrame(animateCursor);
}

animateCursor();


/* =========================================================
   INITIAL FISH POSITION
========================================================= */

function initializeFish() {

  const bounds =
    getFishMovementBounds();

  const width = goldie.offsetWidth;
  const height = goldie.offsetHeight;

  /*
    IMPORTANT:
    Position is calculated using the aquarium itself,
    not screen coordinates.
  */

  fish.x =
    aquarium.clientWidth * 0.5 -
    width * 0.5;

  fish.y =
    aquarium.clientHeight * 0.55 -
    height * 0.5;

  fish.x = clamp(
    fish.x,
    bounds.minX,
    bounds.maxX
  );

  fish.y = clamp(
    fish.y,
    bounds.minY,
    bounds.maxY
  );

  fish.targetX = fish.x;
  fish.targetY = fish.y;

  fish.initialized = true;

  setFishPosition();
  chooseNewFishTarget();
}


/* =========================================================
   MOVEMENT BOUNDARIES
========================================================= */

function getFishMovementBounds() {

  const aquariumWidth =
    aquarium.clientWidth;

  const aquariumHeight =
    aquarium.clientHeight;

  const fishWidth =
    goldie.offsetWidth;

  const fishHeight =
    goldie.offsetHeight;

  const mobile =
    window.innerWidth <= 800;

  /*
    Top boundary leaves room for HUD.
    Bottom boundary leaves room for
    floor and action buttons.
  */

  const minY =
    mobile ? 185 : 130;

  const floorSpace =
    mobile ? 145 : 155;

  return {
    minX: 18,

    maxX: Math.max(
      18,
      aquariumWidth -
      fishWidth -
      18
    ),

    minY: minY,

    maxY: Math.max(
      minY,
      aquariumHeight -
      fishHeight -
      floorSpace
    )
  };
}


/* =========================================================
   CHOOSE RANDOM SWIMMING TARGET
========================================================= */

function chooseNewFishTarget() {

  if (!gameStarted || sleeping || activeFood) {
    return;
  }

  const bounds =
    getFishMovementBounds();

  const horizontalPadding =
    Math.min(
      aquarium.clientWidth * 0.08,
      80
    );

  fish.targetX =
    randomBetween(
      bounds.minX + horizontalPadding,
      Math.max(
        bounds.minX + horizontalPadding,
        bounds.maxX - horizontalPadding
      )
    );

  fish.targetY =
    randomBetween(
      bounds.minY + 20,
      Math.max(
        bounds.minY + 20,
        bounds.maxY - 15
      )
    );
}


/* =========================================================
   FISH ANIMATION LOOP
========================================================= */

function animateFish() {

  if (
    gameStarted &&
    fish.initialized
  ) {

    if (activeFood) {

      fish.targetX =
        activeFood.x -
        goldie.offsetWidth * 0.35;

      fish.targetY =
        activeFood.y -
        goldie.offsetHeight * 0.35;

    } else if (sleeping) {

      const bounds =
        getFishMovementBounds();

      fish.targetX =
        clamp(
          aquarium.clientWidth -
          goldie.offsetWidth -
          95,
          bounds.minX,
          bounds.maxX
        );

      fish.targetY =
        bounds.maxY;

    }


    const dx =
      fish.targetX - fish.x;

    const dy =
      fish.targetY - fish.y;

    const dist =
      Math.hypot(dx, dy);


    let currentSpeed =
      fish.speed;

    if (state.energy < 25) {
      currentSpeed *= 0.45;
    }

    if (state.happiness < 25) {
      currentSpeed *= 0.65;
    }

    if (state.happiness > 85) {
      currentSpeed *= 1.12;
    }

    if (activeFood) {
      currentSpeed *= 2.4;
    }

    if (sleeping) {
      currentSpeed *= 1.6;
    }


    if (dist > 2) {

      fish.x +=
        (dx / dist) *
        currentSpeed;

      fish.y +=
        (dy / dist) *
        currentSpeed;


      if (dx < -1) {
        goldie.classList.add("facing-left");
      }

      if (dx > 1) {
        goldie.classList.remove("facing-left");
      }


      setFishPosition();

    } else {

      if (sleeping) {

        goldie.classList.add("asleep");

      } else if (!activeFood) {

        chooseNewFishTarget();
      }
    }


    updateActiveFood();
  }


  requestAnimationFrame(animateFish);
}

requestAnimationFrame(animateFish);


/* =========================================================
   APPLY FISH POSITION
========================================================= */

function setFishPosition() {

  const bounds =
    getFishMovementBounds();

  fish.x =
    clamp(
      fish.x,
      bounds.minX,
      bounds.maxX
    );

  fish.y =
    clamp(
      fish.y,
      bounds.minY,
      bounds.maxY
    );

  goldie.style.left =
    `${fish.x}px`;

  goldie.style.top =
    `${fish.y}px`;
}


/* =========================================================
   WINDOW RESIZE PROTECTION
========================================================= */

window.addEventListener("resize", () => {

  if (!fish.initialized) {
    return;
  }

  const bounds =
    getFishMovementBounds();

  fish.x =
    clamp(
      fish.x,
      bounds.minX,
      bounds.maxX
    );

  fish.y =
    clamp(
      fish.y,
      bounds.minY,
      bounds.maxY
    );

  fish.targetX =
    clamp(
      fish.targetX,
      bounds.minX,
      bounds.maxX
    );

  fish.targetY =
    clamp(
      fish.targetY,
      bounds.minY,
      bounds.maxY
    );

  setFishPosition();
});


/* =========================================================
   PERIODIC RANDOM TARGET
========================================================= */

setInterval(() => {

  if (
    gameStarted &&
    !sleeping &&
    !activeFood
  ) {

    chooseNewFishTarget();
  }

}, 4000);


/* =========================================================
   BLINKING
========================================================= */

function blink() {

  if (
    gameStarted &&
    !sleeping
  ) {

    goldie.classList.add("blinking");

    setTimeout(() => {
      goldie.classList.remove("blinking");
    }, 130);
  }


  const nextBlink =
    randomBetween(2200, 5200);

  setTimeout(blink, nextBlink);
}

setTimeout(blink, 2500);


/* =========================================================
   PETTING
========================================================= */

goldie.addEventListener(
  "click",
  petGoldie
);

goldie.addEventListener(
  "keydown",
  (event) => {

    if (
      event.key === "Enter" ||
      event.key === " "
    ) {

      event.preventDefault();
      petGoldie();
    }
  }
);


function petGoldie() {

  if (!gameStarted) {
    return;
  }

  if (sleeping) {
    showMessage("SHHH... GOL-DIE IS SLEEPING... Z Z Z");
    return;
  }


  state.affection =
    clamp(
      state.affection + 4,
      0,
      100
    );

  state.happiness =
    clamp(
      state.happiness + 3,
      0,
      100
    );


  goldie.classList.remove("petted");

  void goldie.offsetWidth;

  goldie.classList.add("petted");


  createFishParticles("heart", 6);
  createFishParticles("sparkle", 4);

  showMessage("GOL-DIE LOVES YOU! ♥");

  updateUI();

  setTimeout(() => {
    goldie.classList.remove("petted");
  }, 500);
}


/* =========================================================
   FOOD MENU
========================================================= */

foodButton.addEventListener(
  "click",
  () => {

    if (sleeping) {
      showMessage("GOL-DIE IS SLEEPING! Z Z Z");
      return;
    }

    if (activeFood) {
      showMessage("THERE'S ALREADY FOOD IN THE TANK!");
      return;
    }

    openModal(foodModal);
  }
);


document
  .querySelectorAll(".food-choice")
  .forEach((button) => {

    button.addEventListener(
      "click",
      () => {

        const foodType =
          button.dataset.food;

        closeModal(foodModal);
        dropFood(foodType);
      }
    );

  });


/* =========================================================
   DROP FOOD
========================================================= */

function dropFood(type) {

  if (
    activeFood ||
    !FOOD_DATA[type]
  ) {
    return;
  }

  const food =
    FOOD_DATA[type];

  const element =
    document.createElement("div");

  element.className =
    "falling-food";

  element.textContent =
    food.icon;

  foodLayer.appendChild(element);


  const bounds =
    getFishMovementBounds();

  const startX =
    clamp(
      fish.x +
      goldie.offsetWidth * 0.5 +
      randomBetween(-150, 150),

      30,

      aquarium.clientWidth - 50
    );

  const startY =
    clamp(
      fish.y -
      randomBetween(110, 180),

      110,

      bounds.maxY - 120
    );


  activeFood = {
    type: type,
    element: element,

    x: startX,
    y: startY,

    speed: 0.55
  };


  showMessage("SNACK TIME! 🍎");

  positionFood();
}


/* =========================================================
   FOOD ANIMATION
========================================================= */

function updateActiveFood() {

  if (!activeFood) {
    return;
  }


  activeFood.y +=
    activeFood.speed;


  positionFood();


  const fishCenterX =
    fish.x +
    goldie.offsetWidth * 0.63;

  const fishCenterY =
    fish.y +
    goldie.offsetHeight * 0.52;


  const foodDistance =
    distance(
      fishCenterX,
      fishCenterY,
      activeFood.x,
      activeFood.y
    );


  if (foodDistance < 46) {
    eatFood();
    return;
  }


  const floorY =
    aquarium.clientHeight -
    (
      window.innerWidth <= 800
        ? 88
        : 110
    );


  if (activeFood.y >= floorY) {
    foodSank();
  }
}


function positionFood() {

  if (!activeFood) {
    return;
  }

  activeFood.element.style.left =
    `${activeFood.x}px`;

  activeFood.element.style.top =
    `${activeFood.y}px`;
}


/* =========================================================
   EATING
========================================================= */

function eatFood() {

  if (!activeFood) {
    return;
  }


  const food =
    FOOD_DATA[activeFood.type];


  activeFood.element.remove();
  activeFood = null;


  state.hunger =
    clamp(
      state.hunger + food.hunger,
      0,
      100
    );

  state.health =
    clamp(
      state.health + food.health,
      0,
      100
    );

  state.happiness =
    clamp(
      state.happiness + food.happiness,
      0,
      100
    );

  state.energy =
    clamp(
      state.energy + food.energy,
      0,
      100
    );


  goldie.classList.add("eating");
  goldie.classList.add("excited");


  createFishParticles("heart", 5);
  createFishParticles("sparkle", 6);

  showMessage(food.message);


  updateUI();


  setTimeout(() => {
    goldie.classList.remove("eating");
    goldie.classList.remove("excited");

    chooseNewFishTarget();
  }, 900);
}


function foodSank() {

  if (!activeFood) {
    return;
  }

  activeFood.element.remove();
  activeFood = null;

  state.clean =
    clamp(
      state.clean - 3,
      0,
      100
    );

  showMessage("OH NO! THE FOOD SANK!");

  updateUI();
  chooseNewFishTarget();
}


/* =========================================================
   CLEANING
========================================================= */

cleanButton.addEventListener(
  "click",
  cleanAquarium
);


function cleanAquarium() {

  if (cleaning) {
    return;
  }

  if (sleeping) {
    showMessage("LET GOL-DIE SLEEP FIRST! ♥");
    return;
  }


  cleaning = true;

  cleaningSponge.classList.remove(
    "cleaning"
  );

  void cleaningSponge.offsetWidth;

  cleaningSponge.classList.add(
    "cleaning"
  );


  createCleaningParticles();


  setTimeout(() => {

    state.clean =
      clamp(
        state.clean + 34,
        0,
        100
      );

    state.happiness =
      clamp(
        state.happiness + 5,
        0,
        100
      );


    aquarium.style.filter =
      "brightness(1.12) saturate(1.08)";

    createFishParticles(
      "sparkle",
      8
    );

    showMessage("SPARKLY CLEAN! ✨");

    updateUI();

  }, 900);


  setTimeout(() => {

    cleaningSponge.classList.remove(
      "cleaning"
    );

    aquarium.style.filter = "";

    cleaning = false;

  }, 1900);
}


/* =========================================================
   SLEEP
========================================================= */

sleepButton.addEventListener(
  "click",
  toggleSleep
);


function toggleSleep() {

  if (!sleeping) {
    startSleeping();
  } else {
    wakeGoldie();
  }
}


function startSleeping() {

  if (activeFood) {
    activeFood.element.remove();
    activeFood = null;
  }


  sleeping = true;

  aquarium.classList.add("sleeping");

  sleepText.textContent = "WAKE";
  sleepIcon.textContent = "☀";

  goldie.classList.remove("excited");

  showMessage("SWEET DREAMS, GOL-DIE! ☾");
}


function wakeGoldie() {

  sleeping = false;

  aquarium.classList.remove("sleeping");

  goldie.classList.remove("asleep");

  sleepText.textContent = "SLEEP";
  sleepIcon.textContent = "☾";

  state.happiness =
    clamp(
      state.happiness + 3,
      0,
      100
    );

  createFishParticles(
    "sparkle",
    7
  );

  showMessage("GOOD MORNING! ☀️");

  chooseNewFishTarget();

  updateUI();
}


/* =========================================================
   SLEEP RECOVERY
========================================================= */

setInterval(() => {

  if (
    !gameStarted ||
    !sleeping
  ) {
    return;
  }


  state.energy =
    clamp(
      state.energy + 4,
      0,
      100
    );

  state.health =
    clamp(
      state.health + 1,
      0,
      100
    );

  state.hunger =
    clamp(
      state.hunger - 0.3,
      0,
      100
    );


  updateUI();

}, 2000);


/* =========================================================
   PARTICLES
========================================================= */

function createFishParticles(
  type,
  amount = 5
) {

  const fishCenterX =
    fish.x +
    goldie.offsetWidth * 0.55;

  const fishCenterY =
    fish.y +
    goldie.offsetHeight * 0.42;


  for (
    let i = 0;
    i < amount;
    i++
  ) {

    const particle =
      document.createElement("div");

    particle.className =
      "particle";


    if (type === "heart") {

      particle.classList.add(
        "heart-particle"
      );

      particle.textContent = "♥";

    } else {

      particle.classList.add(
        "sparkle-particle"
      );

      particle.textContent =
        Math.random() > 0.5
          ? "✦"
          : "✧";
    }


    particle.style.left =
      `${fishCenterX +
      randomBetween(-45, 45)}px`;

    particle.style.top =
      `${fishCenterY +
      randomBetween(-15, 35)}px`;

    particle.style.setProperty(
      "--particle-x",
      `${randomBetween(-55, 55)}px`
    );


    particleLayer.appendChild(
      particle
    );


    setTimeout(() => {
      particle.remove();
    }, 1100);
  }
}


/* =========================================================
   CLEANING PARTICLES
========================================================= */

function createCleaningParticles() {

  let count = 0;

  const interval =
    setInterval(() => {

      count++;

      const bubble =
        document.createElement("div");

      bubble.className =
        "particle clean-bubble";

      bubble.style.left =
        `${randomBetween(
          5,
          95
        )}%`;

      bubble.style.top =
        `${randomBetween(
          25,
          75
        )}%`;

      bubble.style.setProperty(
        "--particle-x",
        `${randomBetween(
          -30,
          30
        )}px`
      );


      particleLayer.appendChild(
        bubble
      );


      setTimeout(() => {
        bubble.remove();
      }, 1100);


      if (count >= 20) {
        clearInterval(interval);
      }

    }, 65);
}


/* =========================================================
   GAME MESSAGE
========================================================= */

function showMessage(text) {

  clearTimeout(messageTimeout);

  gameMessage.textContent = text;

  gameMessage.classList.remove(
    "show"
  );

  void gameMessage.offsetWidth;

  gameMessage.classList.add(
    "show"
  );


  messageTimeout =
    setTimeout(() => {

      gameMessage.classList.remove(
        "show"
      );

    }, 1900);
}


/* =========================================================
   GAME CLOCK
========================================================= */

/*
  2 real minutes = 1 in-game hour.

  Therefore:

  120 real seconds = 60 game minutes
  2 real seconds = 1 game minute
*/

setInterval(() => {

  if (!gameStarted) {
    return;
  }


  state.minutes += 1;


  if (state.minutes >= 1440) {

    state.minutes = 0;
    state.day += 1;
  }


  updateClock();
  updateDayNight();

}, 2000);


/* =========================================================
   CLOCK DISPLAY
========================================================= */

function updateClock() {

  const hours24 =
    Math.floor(state.minutes / 60);

  const minutes =
    Math.floor(state.minutes % 60);

  const period =
    hours24 >= 12
      ? "PM"
      : "AM";

  let hours12 =
    hours24 % 12;

  if (hours12 === 0) {
    hours12 = 12;
  }


  clockDisplay.textContent =
    `${String(hours12).padStart(2, "0")}:` +
    `${String(minutes).padStart(2, "0")} ` +
    period;

  dayDisplay.textContent =
    `DAY ${state.day}`;
}


/* =========================================================
   AUTOMATIC DAY / NIGHT
========================================================= */

function updateDayNight() {

  if (!gameStarted) {
    return;
  }

  const hour =
    Math.floor(state.minutes / 60);


  const nightTime =
    hour >= 20 ||
    hour < 6;


  aquarium.classList.toggle(
    "night",
    nightTime && !sleeping
  );


  /*
    Morning reaction at exactly 06:00.
  */

  if (
    hour === 6 &&
    state.minutes % 60 === 0 &&
    !sleeping
  ) {

    showMessage(
      "GOOD MORNING! ☀️"
    );

    createFishParticles(
      "sparkle",
      6
    );
  }
}


/* =========================================================
   STAT DECAY
========================================================= */

setInterval(() => {

  if (!gameStarted) {
    return;
  }


  if (!sleeping) {

    state.hunger =
      clamp(
        state.hunger - 0.9,
        0,
        100
      );

    state.clean =
      clamp(
        state.clean - 0.5,
        0,
        100
      );

    state.energy =
      clamp(
        state.energy - 0.45,
        0,
        100
      );

    state.happiness =
      clamp(
        state.happiness - 0.25,
        0,
        100
      );

  }


  /*
    CONSEQUENCES
  */

  if (state.hunger < 20) {

    state.health =
      clamp(
        state.health - 0.65,
        0,
        100
      );
  }


  if (state.clean < 20) {

    state.health =
      clamp(
        state.health - 0.5,
        0,
        100
      );
  }


  if (
    state.happiness < 15 &&
    state.affection > 0
  ) {

    state.affection =
      clamp(
        state.affection - 0.1,
        0,
        100
      );
  }


  updateUI();
  saveGame();

}, 15000);


/* =========================================================
   UI UPDATE
========================================================= */

function updateUI() {

  Object.keys(stats).forEach(
    (key) => {

      state[key] =
        clamp(
          state[key],
          0,
          100
        );

      stats[key].bar.style.width =
        `${state[key]}%`;

      stats[key].value.textContent =
        Math.round(state[key]);
    }
  );


  updateExpression();
  updateClock();
  updateDayNight();
}


/* =========================================================
   EXPRESSIONS
========================================================= */

function updateExpression() {

  const petStatus =
    document.getElementById("petStatus");


  goldie.classList.toggle(
    "hungry",
    state.hunger < 28 &&
    !sleeping
  );


  if (sleeping) {

    petStatus.textContent =
      "SLEEPING... Z Z Z";

    return;
  }


  if (state.health < 25) {

    petStatus.textContent =
      "NOT FEELING GREAT...";

  } else if (state.hunger < 20) {

    petStatus.textContent =
      "VERY HUNGRY!";

  } else if (state.energy < 20) {

    petStatus.textContent =
      "SOOO SLEEPY...";

  } else if (state.clean < 20) {

    petStatus.textContent =
      "MY TANK IS MESSY!";

  } else if (state.happiness < 25) {

    petStatus.textContent =
      "NEEDS SOME LOVE";

  } else if (state.affection > 85) {

    petStatus.textContent =
      "BEST FRIENDS FOREVER ♥";

  } else if (state.happiness > 85) {

    petStatus.textContent =
      "SUPER HAPPY! ✦";

  } else {

    petStatus.textContent =
      "HAPPY LITTLE FISH";
  }
}


/* =========================================================
   SETTINGS
========================================================= */

motionToggle.addEventListener(
  "change",
  () => {

    document.body.classList.toggle(
      "reduced-motion",
      motionToggle.checked
    );

    localStorage.setItem(
      "goldieReducedMotion",
      String(motionToggle.checked)
    );
  }
);


bubbleToggle.addEventListener(
  "change",
  () => {

    const visible =
      bubbleToggle.checked;

    document
      .querySelectorAll(
        ".title-bubbles, .background-bubbles"
      )
      .forEach((layer) => {

        layer.style.display =
          visible
            ? ""
            : "none";
      });


    localStorage.setItem(
      "goldieBubbles",
      String(visible)
    );
  }
);


/* =========================================================
   RESET SAVE
========================================================= */

resetButton.addEventListener(
  "click",
  () => {

    const confirmed =
      window.confirm(
        "Reset GOL-DIE and start again?"
      );

    if (!confirmed) {
      return;
    }


    localStorage.removeItem(
      "goldieSave"
    );

    state = {
      ...DEFAULT_STATE
    };


    sleeping = false;

    aquarium.classList.remove(
      "sleeping",
      "night"
    );

    goldie.classList.remove(
      "asleep",
      "hungry",
      "petted",
      "excited",
      "eating"
    );

    sleepText.textContent =
      "SLEEP";

    sleepIcon.textContent =
      "☾";


    updateUI();

    closeModal(settingsModal);

    if (gameStarted) {
      initializeFish();
      showMessage("A FRESH START! ♥");
    }
  }
);


/* =========================================================
   LOAD SETTINGS
========================================================= */

function loadSettings() {

  const reducedMotion =
    localStorage.getItem(
      "goldieReducedMotion"
    );

  const bubbles =
    localStorage.getItem(
      "goldieBubbles"
    );


  if (reducedMotion === "true") {

    motionToggle.checked = true;

    document.body.classList.add(
      "reduced-motion"
    );
  }


  if (bubbles === "false") {

    bubbleToggle.checked = false;

    document
      .querySelectorAll(
        ".title-bubbles, .background-bubbles"
      )
      .forEach((layer) => {

        layer.style.display =
          "none";
      });
  }
}


/* =========================================================
   AUTOSAVE
========================================================= */

setInterval(() => {

  if (gameStarted) {
    saveGame();
  }

}, 10000);


window.addEventListener(
  "beforeunload",
  saveGame
);


/* =========================================================
   INITIAL PAGE SETUP
========================================================= */

loadGame();
loadSettings();
updateUI();
