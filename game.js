/* =========================================================
   GOL-DIE
   RETRO PIXEL AQUARIUM GAME
========================================================= */


/* =========================================================
   ELEMENTS
========================================================= */

const aquarium =
    document.getElementById("aquarium");

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


/* =========================================================
   STAT BARS
========================================================= */

const bars = {

    health:
        document.getElementById(
            "health-bar"
        ),

    hunger:
        document.getElementById(
            "hunger-bar"
        ),

    happiness:
        document.getElementById(
            "happiness-bar"
        ),

    affection:
        document.getElementById(
            "affection-bar"
        ),

    clean:
        document.getElementById(
            "clean-bar"
        ),

    energy:
        document.getElementById(
            "energy-bar"
        )
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

    x: window.innerWidth / 2,

    y: window.innerHeight * 0.55,

    targetX:
        window.innerWidth / 2,

    targetY:
        window.innerHeight * 0.55
};


/* =========================================================
   UTILITY
========================================================= */

function clamp(
    value,
    min = 0,
    max = 100
) {

    return Math.max(
        min,
        Math.min(
            max,
            value
        )
    );
}


/* =========================================================
   MESSAGE
========================================================= */

function showMessage(text) {

    message.textContent =
        text;

    message.classList.add(
        "show"
    );

    clearTimeout(
        showMessage.timer
    );

    showMessage.timer =
        setTimeout(
            () => {

                message.classList.remove(
                    "show"
                );

            },
            1800
        );
}


/* =========================================================
   UPDATE STAT BARS
========================================================= */

function updateBars() {

    bars.health.style.width =
        state.health + "%";

    bars.hunger.style.width =
        state.hunger + "%";

    bars.happiness.style.width =
        state.happiness + "%";

    bars.affection.style.width =
        state.affection + "%";

    bars.clean.style.width =
        state.clean + "%";

    bars.energy.style.width =
        state.energy + "%";
}


/* =========================================================
   GAME TIME
=========================================================

   2 REAL MINUTES
   =
   1 FISH HOUR
========================================================= */

const REAL_MS_PER_FISH_HOUR =
    2 * 60 * 1000;


let lastTime =
    Date.now();


let elapsedFishTime = 0;


function updateFishTime() {

    const now =
        Date.now();

    const delta =
        now - lastTime;

    lastTime =
        now;

    elapsedFishTime +=
        delta;


    while (
        elapsedFishTime >=
        REAL_MS_PER_FISH_HOUR
    ) {

        elapsedFishTime -=
            REAL_MS_PER_FISH_HOUR;

        state.fishHour++;

        if (
            state.fishHour >= 24
        ) {

            state.fishHour = 0;

            state.day++;
        }

        hourlyDecay();
    }


    let hour =
        state.fishHour;


    const ampm =
        hour >= 12
            ? "PM"
            : "AM";


    let displayHour =
        hour % 12;


    if (
        displayHour === 0
    ) {

        displayHour = 12;
    }


    fishTime.textContent =
        String(
            displayHour
        ).padStart(
            2,
            "0"
        ) +
        ":00 " +
        ampm;


    dayCounter.textContent =
        "DAY " +
        state.day;
}


/* =========================================================
   HOURLY STAT DECAY
========================================================= */

function hourlyDecay() {

    if (
        state.sleeping
    ) {

        state.energy =
            clamp(
                state.energy + 9
            );

        state.health =
            clamp(
                state.health + 2
            );

        state.hunger =
            clamp(
                state.hunger - 3
            );

    } else {

        state.hunger =
            clamp(
                state.hunger - 5
            );

        state.clean =
            clamp(
                state.clean - 3
            );

        state.energy =
            clamp(
                state.energy - 4
            );

        state.happiness =
            clamp(
                state.happiness - 2
            );


        if (
            state.hunger < 25
        ) {

            state.health =
                clamp(
                    state.health - 4
                );
        }


        if (
            state.clean < 25
        ) {

            state.health =
                clamp(
                    state.health - 3
                );
        }
    }


    updateBars();
}


/* =========================================================
   CUSTOM CURSOR
========================================================= */

document.addEventListener(
    "mousemove",
    event => {

        cursor.style.left =
            event.clientX + "px";

        cursor.style.top =
            event.clientY + "px";
    }
);


/* =========================================================
   DRAW FISH
========================================================= */

function drawFish() {

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    /*
        Direction.

        The fish is drawn facing right.
        If direction = -1 it flips horizontally.
    */

    const flip =
        state.direction === -1
            ? -1
            : 1;


    ctx.save();


    ctx.translate(
        110,
        80
    );


    ctx.scale(
        flip,
        1
    );


    /* =====================================================
       TAIL
    ===================================================== */

    ctx.fillStyle =
        "#e87525";

    ctx.beginPath();

    ctx.moveTo(
        45,
        -4
    );

    ctx.lineTo(
        86,
        -35
    );

    ctx.lineTo(
        73,
        -3
    );

    ctx.lineTo(
        90,
        25
    );

    ctx.lineTo(
        48,
        10
    );

    ctx.closePath();

    ctx.fill();


    /* Tail shadow */

    ctx.fillStyle =
        "#bd4e20";

    ctx.fillRect(
        61,
        2,
        22,
        8
    );


    /* =====================================================
       BODY
    ===================================================== */

    ctx.fillStyle =
        "#f58a28";

    ctx.beginPath();

    ctx.ellipse(
        0,
        0,
        62,
        42,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /* =====================================================
       BODY SHADOW
    ===================================================== */

    ctx.fillStyle =
        "#d75a20";

    ctx.fillRect(
        -42,
        18,
        68,
        14
    );


    /* =====================================================
       BODY HIGHLIGHTS
    ===================================================== */

    ctx.fillStyle =
        "#ffbd3d";

    ctx.fillRect(
        -25,
        -27,
        35,
        9
    );

    ctx.fillRect(
        -35,
        -17,
        25,
        8
    );


    /* =====================================================
       TOP FIN
    ===================================================== */

    ctx.fillStyle =
        "#f26c20";

    ctx.beginPath();

    ctx.moveTo(
        -12,
        -34
    );

    ctx.lineTo(
        12,
        -62
    );

    ctx.lineTo(
        30,
        -33
    );

    ctx.closePath();

    ctx.fill();


    /* =====================================================
       LOWER FIN
    ===================================================== */

    ctx.fillStyle =
        "#e46521";

    ctx.beginPath();

    ctx.moveTo(
        -8,
        30
    );

    ctx.lineTo(
        10,
        55
    );

    ctx.lineTo(
        25,
        30
    );

    ctx.closePath();

    ctx.fill();


    /* =====================================================
       EYE
    ===================================================== */

    ctx.fillStyle =
        "#f9df7b";

    ctx.fillRect(
        -48,
        -19,
        23,
        23
    );


    ctx.fillStyle =
        "#1e2527";

    ctx.fillRect(
        -43,
        -15,
        13,
        15
    );


    /* Eye shine */

    ctx.fillStyle =
        "#ffffff";

    ctx.fillRect(
        -40,
        -13,
        4,
        4
    );


    /* =====================================================
       MOUTH
    ===================================================== */

    ctx.fillStyle =
        "#7e3424";

    ctx.fillRect(
        -60,
        8,
        11,
        6
    );


    /* =====================================================
       PIXEL SCALES
    ===================================================== */

    ctx.fillStyle =
        "rgba(255,205,65,0.55)";


    const scales = [

        [-18, -5],

        [0, -9],

        [18, -2],

        [-23, 12],

        [-2, 10],

        [18, 13],

        [2, 25]
    ];


    for (
        const [x, y]
        of scales
    ) {

        ctx.fillRect(
            x,
            y,
            8,
            5
        );
    }


    ctx.restore();
}


/* =========================================================
   KEEP FISH ON SCREEN
========================================================= */

function keepFishOnScreen() {

    const width =
        window.innerWidth;

    const height =
        window.innerHeight;


    /*
        Keep fish underneath the HUD
        and above the gravel.
    */

    const minX =
        Math.max(
            120,
            width * 0.15
        );


    const maxX =
        Math.min(
            width - 120,
            width * 0.85
        );


    const minY =
        Math.max(
            190,
            height * 0.30
        );


    const maxY =
        Math.min(
            height - 130,
            height * 0.78
        );


    state.targetX =
        Math.max(
            minX,
            Math.min(
                maxX,
                state.targetX
            )
        );


    state.targetY =
        Math.max(
            minY,
            Math.min(
                maxY,
                state.targetY
            )
        );
}


/* =========================================================
   MOVE FISH
========================================================= */

function moveFish() {

    if (
        state.sleeping
    ) {

        return;
    }


    const dx =
        state.targetX -
        state.x;


    const dy =
        state.targetY -
        state.y;


    state.x +=
        dx * 0.008;


    state.y +=
        dy * 0.008;


    if (
        Math.abs(dx) > 2
    ) {

        state.direction =
            dx > 0
                ? 1
                : -1;
    }


    fishContainer.style.left =
        state.x + "px";


    fishContainer.style.top =
        state.y + "px";


    if (
        Math.abs(dx) < 5 &&
        Math.abs(dy) < 5
    ) {

        chooseFishTarget();
    }
}


/* =========================================================
   CHOOSE RANDOM FISH DESTINATION
========================================================= */

function chooseFishTarget() {

    const width =
        window.innerWidth;

    const height =
        window.innerHeight;


    state.targetX =
        width *
        (
            0.20 +
            Math.random() *
            0.60
        );


    state.targetY =
        height *
        (
            0.35 +
            Math.random() *
            0.35
        );


    keepFishOnScreen();
}


/* =========================================================
   PET FISH
=========================================================

   Clicking directly on the fish pets it.
========================================================= */

fishContainer.addEventListener(
    "click",
    event => {

        if (
            state.sleeping
        ) {

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

function createHearts(
    x,
    y
) {

    for (
        let i = 0;
        i < 4;
        i++
    ) {

        const heart =
            document.createElement(
                "div"
            );


        heart.className =
            "heart";


        heart.textContent =
            "♥";


        heart.style.left =
            (
                x +
                (
                    Math.random() *
                    40 -
                    20
                )
            ) +
            "px";


        heart.style.top =
            (
                y +
                (
                    Math.random() *
                    20 -
                    10
                )
            ) +
            "px";


        heart.style.setProperty(
            "--heart-x",
            (
                Math.random() *
                60 -
                30
            ) +
            "px"
        );


        document.body.appendChild(
            heart
        );


        setTimeout(
            () => {

                heart.remove();

            },
            1300
        );
    }
}


/* =========================================================
   FOOD
========================================================= */

const foodButton =
    document.getElementById(
        "food-button"
    );


foodButton.addEventListener(
    "click",
    () => {

        foodPanel.style.display =
            foodPanel.style.display ===
            "block"
                ? "none"
                : "block";
    }
);


/* =========================================================
   FOOD CHOICE
========================================================= */

document
    .querySelectorAll(
        ".food-choice"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    spawnFood();

                    foodPanel.style.display =
                        "none";

                    showMessage(
                        "A FISH FLAKE APPEARED!"
                    );
                }
            );
        }
    );


/* =========================================================
   CREATE FOOD
========================================================= */

function spawnFood() {

    const food =
        document.createElement(
            "div"
        );


    food.className =
        "food-item";


    const pellet =
        document.createElement(
            "div"
        );


    pellet.className =
        "food-pellet";


    food.appendChild(
        pellet
    );


    food.style.left =
        (
            window.innerWidth / 2 +
            Math.random() * 160 -
            80
        ) +
        "px";


    food.style.top =
        "130px";


    aquarium.appendChild(
        food
    );


    let y =
        130;


    const fall =
        setInterval(
            () => {

                y += 1.5;


                food.style.top =
                    y + "px";


                const fishX =
                    state.x;


                const fishY =
                    state.y;


                const foodX =
                    parseFloat(
                        food.style.left
                    );


                /*
                    If the food reaches
                    the fish, feed it.
                */

                if (
                    Math.abs(
                        foodX -
                        fishX
                    ) < 90 &&
                    Math.abs(
                        y -
                        fishY
                    ) < 70
                ) {

                    clearInterval(
                        fall
                    );


                    feedFish(
                        food
                    );


                    return;
                }


                /*
                    Food has hit the floor.
                */

                if (
                    y >
                    window.innerHeight - 80
                ) {

                    clearInterval(
                        fall
                    );


                    food.remove();


                    showMessage(
                        "THE FOOD SANK..."
                    );
                }

            },
            25
        );
}


/* =========================================================
   FEED FISH
========================================================= */

function feedFish(
    food
) {

    if (
        state.sleeping
    ) {

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


    showMessage(
        "YUM! GOL-DIE ATE!"
    );


    updateBars();
}


/* =========================================================
   CLEAN BUTTON
========================================================= */

const cleanButton =
    document.getElementById(
        "clean-button"
    );


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


        showMessage(
            "THE TANK IS SPARKLY!"
        );


        updateBars();
    }
);


/* =========================================================
   SLEEP BUTTON
========================================================= */

const sleepButton =
    document.getElementById(
        "sleep-button"
    );


sleepButton.addEventListener(
    "click",
    () => {

        state.sleeping =
            !state.sleeping;


        if (
            state.sleeping
        ) {

            sleepZone.style.display =
                "block";


            aquarium.classList.add(
                "night"
            );


            showMessage(
                "GOODNIGHT GOL-DIE..."
            );

        } else {

            sleepZone.style.display =
                "none";


            aquarium.classList.remove(
                "night"
            );


            showMessage(
                "GOOD MORNING! ♥"
            );
        }
    }
);


/* =========================================================
   WINDOW RESIZE
========================================================= */

window.addEventListener(
    "resize",
    () => {

        if (
            state.x >
            window.innerWidth
        ) {

            state.x =
                window.innerWidth / 2;
        }


        if (
            state.y >
            window.innerHeight
        ) {

            state.y =
                window.innerHeight * 0.55;
        }


        keepFishOnScreen();
    }
);


/* =========================================================
   GAME LOOP
========================================================= */

function gameLoop() {

    updateFishTime();

    moveFish();

    drawFish();

    requestAnimationFrame(
        gameLoop
    );
}


/* =========================================================
   INITIALISE GAME
========================================================= */

function initialise() {

    /*
        Explicitly place the fish in
        the centre of the aquarium.
    */

    state.x =
        window.innerWidth / 2;


    state.y =
        window.innerHeight * 0.55;


    state.targetX =
        window.innerWidth / 2;


    state.targetY =
        window.innerHeight * 0.55;


    fishContainer.style.left =
        state.x + "px";


    fishContainer.style.top =
        state.y + "px";


    updateBars();


    chooseFishTarget();


    drawFish();


    gameLoop();
}


/* =========================================================
   START
========================================================= */

initialise();
