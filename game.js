/* =========================================================
   GOL-DIE
   PIXEL AQUARIUM TAMAGOTCHI GAME
========================================================= */

"use strict";


/* =========================================================
   ELEMENTS
========================================================= */

const aquarium = document.getElementById("aquarium");

const fishContainer =
    document.getElementById("fish-container");

const canvas =
    document.getElementById("fish-canvas");

const ctx =
    canvas.getContext("2d");

const cursor =
    document.getElementById("hand-cursor");

const message =
    document.getElementById("message");

const foodPanel =
    document.getElementById("food-panel");

const sleepZone =
    document.getElementById("sleep-zone");

const fishTime =
    document.getElementById("fish-time");

const dayCounter =
    document.getElementById("day-counter");

const foodButton =
    document.getElementById("food-button");

const cleanButton =
    document.getElementById("clean-button");

const sleepButton =
    document.getElementById("sleep-button");


/* =========================================================
   STAT BARS
========================================================= */

const bars = {
    health: document.getElementById("health-bar"),
    hunger: document.getElementById("hunger-bar"),
    happiness: document.getElementById("happiness-bar"),
    affection: document.getElementById("affection-bar"),
    clean: document.getElementById("clean-bar"),
    energy: document.getElementById("energy-bar")
};


/* =========================================================
   GAME STATE
========================================================= */

const state = {

    health: 100,

    hunger: 82,

    happiness: 76,

    affection: 58,

    clean: 90,

    energy: 85,

    sleeping: false,

    fishHour: 8,

    day: 1,

    direction: 1,

    x: 0,

    y: 0,

    targetX: 0,

    targetY: 0,

    bob: 0,

    lastTargetChange: 0

};


/* =========================================================
   SETTINGS
========================================================= */

const SETTINGS = {

    /*
        Two real minutes = one in-game hour.
    */

    realMillisecondsPerFishHour:
        2 * 60 * 1000,

    fishSpeed: 0.018,

    fishWidth: 170,

    fishHeight: 130

};


/* =========================================================
   UTILITY
========================================================= */

function clamp(value, min = 0, max = 100) {

    return Math.max(
        min,
        Math.min(max, value)
    );

}


/* =========================================================
   GET AQUARIUM SIZE
========================================================= */

function getAquariumBounds() {

    const rect =
        aquarium.getBoundingClientRect();

    return {
        width: rect.width,
        height: rect.height
    };

}


/* =========================================================
   MESSAGE
========================================================= */

function showMessage(text) {

    message.textContent = text;

    message.classList.add("show");

    clearTimeout(showMessage.timer);

    showMessage.timer = setTimeout(() => {

        message.classList.remove("show");

    }, 1800);

}


/* =========================================================
   UPDATE STAT BARS
========================================================= */

function updateBars() {

    bars.health.style.width =
        `${clamp(state.health)}%`;

    bars.hunger.style.width =
        `${clamp(state.hunger)}%`;

    bars.happiness.style.width =
        `${clamp(state.happiness)}%`;

    bars.affection.style.width =
        `${clamp(state.affection)}%`;

    bars.clean.style.width =
        `${clamp(state.clean)}%`;

    bars.energy.style.width =
        `${clamp(state.energy)}%`;

}


/* =========================================================
   GAME TIME
========================================================= */

let lastTime = performance.now();

let elapsedFishTime = 0;


function updateFishTime(now) {

    const delta =
        now - lastTime;

    lastTime = now;

    elapsedFishTime += delta;


    while (
        elapsedFishTime >=
        SETTINGS.realMillisecondsPerFishHour
    ) {

        elapsedFishTime -=
            SETTINGS.realMillisecondsPerFishHour;

        state.fishHour++;

        if (state.fishHour >= 24) {

            state.fishHour = 0;

            state.day++;

        }

        hourlyDecay();

    }


    const hour =
        state.fishHour;

    const ampm =
        hour >= 12 ? "PM" : "AM";

    let displayHour =
        hour % 12;

    if (displayHour === 0) {
        displayHour = 12;
    }

    fishTime.textContent =
        `${String(displayHour).padStart(2, "0")}:00 ${ampm}`;

    dayCounter.textContent =
        `DAY ${state.day}`;

}


/* =========================================================
   STAT DECAY
========================================================= */

function hourlyDecay() {

    if (state.sleeping) {

        state.energy =
            clamp(state.energy + 10);

        state.health =
            clamp(state.health + 2);

        state.hunger =
            clamp(state.hunger - 3);

        state.happiness =
            clamp(state.happiness + 1);

    } else {

        state.hunger =
            clamp(state.hunger - 5);

        state.clean =
            clamp(state.clean - 3);

        state.energy =
            clamp(state.energy - 4);

        state.happiness =
            clamp(state.happiness - 2);


        if (state.hunger < 25) {

            state.health =
                clamp(state.health - 4);

        }


        if (state.clean < 25) {

            state.health =
                clamp(state.health - 3);

        }


        if (state.energy < 15) {

            state.happiness =
                clamp(state.happiness - 3);

        }

    }

    updateBars();

}


/* =========================================================
   CUSTOM CURSOR
========================================================= */

document.addEventListener("pointermove", event => {

    cursor.style.left =
        `${event.clientX}px`;

    cursor.style.top =
        `${event.clientY}px`;

});


/* =========================================================
   FISH MOVEMENT AREA
========================================================= */

function getFishMovementBounds() {

    const bounds =
        getAquariumBounds();

    const topSafe =
        Math.max(
            250,
            bounds.height * 0.30
        );

    const bottomSafe =
        Math.max(
            topSafe + 100,
            bounds.height - 130
        );

    const leftSafe =
        Math.max(
            120,
            bounds.width * 0.15
        );

    const rightSafe =
        Math.min(
            bounds.width - 120,
            bounds.width * 0.85
        );

    return {
        left: leftSafe,
        right: Math.max(leftSafe + 50, rightSafe),
        top: topSafe,
        bottom: Math.max(topSafe + 50, bottomSafe)
    };

}


/* =========================================================
   CHOOSE FISH TARGET
========================================================= */

function chooseFishTarget() {

    const bounds =
        getFishMovementBounds();


    state.targetX =
        bounds.left +
        Math.random() *
        (bounds.right - bounds.left);


    state.targetY =
        bounds.top +
        Math.random() *
        (bounds.bottom - bounds.top);


    state.lastTargetChange =
        performance.now();

}


/* =========================================================
   KEEP FISH ON SCREEN
========================================================= */

function keepFishOnScreen() {

    const bounds =
        getFishMovementBounds();


    state.x =
        clamp(
            state.x,
            bounds.left,
            bounds.right
        );


    state.y =
        clamp(
            state.y,
            bounds.top,
            bounds.bottom
        );


    state.targetX =
        clamp(
            state.targetX,
            bounds.left,
            bounds.right
        );


    state.targetY =
        clamp(
            state.targetY,
            bounds.top,
            bounds.bottom
        );

}


/* =========================================================
   MOVE FISH
========================================================= */

function moveFish(now) {

    if (state.sleeping) {
        return;
    }


    const dx =
        state.targetX - state.x;

    const dy =
        state.targetY - state.y;


    state.x +=
        dx * SETTINGS.fishSpeed;

    state.y +=
        dy * SETTINGS.fishSpeed;


    if (Math.abs(dx) > 2) {

        state.direction =
            dx > 0 ? 1 : -1;

    }


    /*
        Small swimming bob.
    */

    state.bob += 0.045;


    const bobOffset =
        Math.sin(state.bob) * 3;


    fishContainer.style.left =
        `${state.x}px`;

    fishContainer.style.top =
        `${state.y + bobOffset}px`;


    /*
        Choose a new destination
        after reaching the old one.
    */

    if (
        Math.abs(dx) < 8 &&
        Math.abs(dy) < 8
    ) {

        chooseFishTarget();

    }


    /*
        Also prevent the fish from
        sitting at one target forever.
    */

    if (
        now - state.lastTargetChange >
        7000
    ) {

        chooseFishTarget();

    }

}


/* =========================================================
   DRAW PIXEL FISH
========================================================= */

function drawFish() {

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    ctx.save();


    /*
        Centre the fish.
    */

    ctx.translate(110, 80);


    /*
        Flip fish when swimming
        in the opposite direction.
    */

    ctx.scale(
        state.direction,
        1
    );


    /*
        PIXELATED TAIL
    */

    ctx.fillStyle = "#e87525";

    ctx.beginPath();

    ctx.moveTo(45, -4);
    ctx.lineTo(88, -38);
    ctx.lineTo(76, -3);
    ctx.lineTo(92, 29);
    ctx.lineTo(47, 12);

    ctx.closePath();

    ctx.fill();


    /*
        Tail darker pixels.
    */

    ctx.fillStyle = "#b94c22";

    ctx.fillRect(
        61,
        1,
        25,
        9
    );


    ctx.fillStyle = "#f7a12b";

    ctx.fillRect(
        69,
        -21,
        10,
        8
    );


    /*
        BODY OUTLINE
    */

    ctx.fillStyle = "#492d27";

    ctx.beginPath();

    ctx.ellipse(
        0,
        0,
        65,
        44,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /*
        BODY
    */

    ctx.fillStyle = "#f58a28";

    ctx.beginPath();

    ctx.ellipse(
        0,
        0,
        60,
        39,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /*
        BODY SHADOW
    */

    ctx.fillStyle = "#d65a20";

    ctx.fillRect(
        -42,
        17,
        70,
        14
    );


    ctx.fillRect(
        -34,
        28,
        42,
        7
    );


    /*
        GOLD HIGHLIGHTS
    */

    ctx.fillStyle = "#ffbd3d";

    ctx.fillRect(
        -27,
        -27,
        37,
        8
    );

    ctx.fillRect(
        -37,
        -17,
        25,
        7
    );

    ctx.fillRect(
        10,
        -14,
        15,
        6
    );


    /*
        TOP FIN
    */

    ctx.fillStyle = "#e96d22";

    ctx.beginPath();

    ctx.moveTo(-13, -31);
    ctx.lineTo(11, -61);
    ctx.lineTo(31, -31);

    ctx.closePath();

    ctx.fill();


    /*
        TOP FIN HIGHLIGHT
    */

    ctx.fillStyle = "#ff9a2d";

    ctx.fillRect(
        2,
        -48,
        13,
        7
    );


    /*
        LOWER FIN
    */

    ctx.fillStyle = "#df6220";

    ctx.beginPath();

    ctx.moveTo(-10, 29);
    ctx.lineTo(10, 56);
    ctx.lineTo(26, 29);

    ctx.closePath();

    ctx.fill();


    /*
        EYE
    */

    ctx.fillStyle = "#f9df7b";

    ctx.fillRect(
        -49,
        -20,
        23,
        23
    );


    ctx.fillStyle = "#202326";

    ctx.fillRect(
        -44,
        -16,
        13,
        15
    );


    /*
        Eye shine.
    */

    ctx.fillStyle = "#ffffff";

    ctx.fillRect(
        -41,
        -14,
        4,
        4
    );


    /*
        MOUTH
    */

    ctx.fillStyle = "#71332b";

    ctx.fillRect(
        -60,
        8,
        11,
        6
    );


    /*
        PIXEL SCALES
    */

    ctx.fillStyle = "#ffd05b";

    const scales = [
        [-18, -5],
        [0, -9],
        [18, -2],
        [-23, 12],
        [-2, 10],
        [18, 13],
        [2, 25]
    ];


    scales.forEach(([x, y]) => {

        ctx.fillRect(
            x,
            y,
            8,
            5
        );

    });


    /*
        Finishing pixel.
    */

    ctx.fillStyle = "#fff0a1";

    ctx.fillRect(
        27,
        -8,
        6,
        5
    );


    ctx.restore();

}


/* =========================================================
   PET FISH
========================================================= */

fishContainer.addEventListener(
    "pointerdown",
    event => {

        event.preventDefault();

        if (state.sleeping) {

            showMessage(
                "GOL-DIE IS SLEEPING..."
            );

            return;

        }


        state.affection =
            clamp(
                state.affection + 6
            );


        state.happiness =
            clamp(
                state.happiness + 4
            );


        state.energy =
            clamp(
                state.energy - 1
            );


        createHearts(
            event.clientX,
            event.clientY
        );


        showMessage(
            "GOL-DIE LIKES THAT ♥"
        );


        updateBars();

    }
);


/* =========================================================
   HEART EFFECT
========================================================= */

function createHearts(x, y) {

    for (let i = 0; i < 4; i++) {

        const heart =
            document.createElement("div");


        heart.className = "heart";

        heart.textContent = "♥";


        heart.style.left =
            `${x + Math.random() * 40 - 20}px`;

        heart.style.top =
            `${y + Math.random() * 20 - 10}px`;


        heart.style.setProperty(
            "--heart-x",
            `${Math.random() * 60 - 30}px`
        );


        document.body.appendChild(heart);


        setTimeout(() => {

            heart.remove();

        }, 1300);

    }

}


/* =========================================================
   FOOD MENU
========================================================= */

foodButton.addEventListener("click", () => {

    const isOpen =
        foodPanel.classList.contains("open");


    foodPanel.classList.toggle(
        "open",
        !isOpen
    );

});


/* =========================================================
   FOOD CHOICE
========================================================= */

document
    .querySelectorAll(".food-choice")
    .forEach(button => {

        button.addEventListener("click", () => {

            if (state.sleeping) {

                showMessage(
                    "GOL-DIE IS SLEEPING!"
                );

                foodPanel.classList.remove("open");

                return;

            }


            spawnFood();

            foodPanel.classList.remove("open");

            showMessage(
                "A FISH FLAKE APPEARED!"
            );

        });

    });


/* =========================================================
   SPAWN FOOD
========================================================= */

function spawnFood() {

    const food =
        document.createElement("div");


    food.className = "food-item";


    const pellet =
        document.createElement("div");


    pellet.className = "food-pellet";


    food.appendChild(pellet);


    const bounds =
        getAquariumBounds();


    const startX =
        state.x +
        (Math.random() * 80 - 40);


    const safeX =
        clamp(
            startX,
            80,
            bounds.width - 80
        );


    food.style.left =
        `${safeX}px`;


    food.style.top =
        `105px`;


    aquarium.appendChild(food);


    let y = 105;


    const fall =
        setInterval(() => {

            y += 2;


            food.style.top =
                `${y}px`;


            const foodX =
                safeX;


            const fishX =
                state.x;


            const fishY =
                state.y;


            /*
                Food reaches fish.
            */

            if (
                Math.abs(foodX - fishX) < 100 &&
                Math.abs(y - fishY) < 70
            ) {

                clearInterval(fall);

                feedFish(food);

                return;

            }


            /*
                Food reaches gravel.
            */

            if (
                y >
                bounds.height - 90
            ) {

                clearInterval(fall);

                food.remove();

                showMessage(
                    "THE FOOD SANK..."
                );

            }

        }, 25);

}


/* =========================================================
   FEED FISH
========================================================= */

function feedFish(food) {

    if (state.sleeping) {

        food.remove();

        showMessage(
            "GOL-DIE IS SLEEPING!"
        );

        return;

    }


    state.hunger =
        clamp(
            state.hunger + 22
        );


    state.health =
        clamp(
            state.health + 4
        );


    state.happiness =
        clamp(
            state.happiness + 5
        );


    state.energy =
        clamp(
            state.energy + 2
        );


    food.remove();


    createHearts(
        state.x,
        state.y
    );


    showMessage(
        "YUM! GOL-DIE ATE!"
    );


    updateBars();

}


/* =========================================================
   CLEAN TANK
========================================================= */

cleanButton.addEventListener(
    "click",
    () => {

        state.clean =
            clamp(
                state.clean + 35
            );


        state.happiness =
            clamp(
                state.happiness + 4
            );


        state.health =
            clamp(
                state.health + 2
            );


        showMessage(
            "THE TANK IS SPARKLY!"
        );


        createBubbles();


        updateBars();

    }
);


/* =========================================================
   CLEANING BUBBLES
========================================================= */

function createBubbles() {

    for (let i = 0; i < 8; i++) {

        const bubble =
            document.createElement("div");


        bubble.className =
            "clean-bubble";


        bubble.style.left =
            `${state.x + Math.random() * 100 - 50}px`;


        bubble.style.top =
            `${state.y + Math.random() * 60 - 30}px`;


        bubble.style.setProperty(
            "--bubble-x",
            `${Math.random() * 80 - 40}px`
        );


        aquarium.appendChild(bubble);


        setTimeout(() => {

            bubble.remove();

        }, 1600);

    }

}


/* =========================================================
   SLEEP
========================================================= */

sleepButton.addEventListener(
    "click",
    () => {

        state.sleeping =
            !state.sleeping;


        if (state.sleeping) {

            sleepZone.classList.add("active");

            aquarium.classList.add("night");

            sleepButton.textContent =
                "WAKE";

            showMessage(
                "GOODNIGHT GOL-DIE..."
            );

        } else {

            sleepZone.classList.remove("active");

            aquarium.classList.remove("night");

            sleepButton.textContent =
                "SLEEP";

            showMessage(
                "GOOD MORNING! ♥"
            );

        }

    }
);


/* =========================================================
   RESIZE
========================================================= */

window.addEventListener(
    "resize",
    () => {

        keepFishOnScreen();

        fishContainer.style.left =
            `${state.x}px`;

        fishContainer.style.top =
            `${state.y}px`;

    }
);


/* =========================================================
   GAME LOOP
========================================================= */

function gameLoop(now) {

    updateFishTime(now);

    moveFish(now);

    drawFish();

    requestAnimationFrame(gameLoop);

}


/* =========================================================
   INITIALISE
========================================================= */

function initialise() {

    const bounds =
        getFishMovementBounds();


    /*
        Start fish in the actual
        centre of the aquarium.
    */

    state.x =
        bounds.left +
        (bounds.right - bounds.left) / 2;


    state.y =
        bounds.top +
        (bounds.bottom - bounds.top) / 2;


    state.targetX =
        state.x;


    state.targetY =
        state.y;


    keepFishOnScreen();

    updateBars();

    chooseFishTarget();

    drawFish();


    fishContainer.style.left =
        `${state.x}px`;

    fishContainer.style.top =
        `${state.y}px`;


    requestAnimationFrame(gameLoop);

}


/* =========================================================
   START GAME
========================================================= */

initialise();
