/* =====================================================
   FIN & FRIENDS
   FULL SCREEN RETRO FISH GAME
===================================================== */


/* =====================================================
   START WHEN HTML IS READY
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        startGame();

    }
);


/* =====================================================
   MAIN GAME
===================================================== */

function startGame() {


    /* =================================================
       GET HTML ELEMENTS
    ================================================= */

    const elements = {

        aquarium:
            document.getElementById("aquarium"),

        handCursor:
            document.getElementById("handCursor"),

        fish:
            document.getElementById("fish"),

        fishMouth:
            document.getElementById("fishMouth"),

        fishBlanket:
            document.getElementById("fishBlanket"),

        fishPillow:
            document.getElementById("fishPillow"),

        sleepZzz:
            document.getElementById("sleepZzz"),

        speech:
            document.getElementById("speech"),

        heartContainer:
            document.getElementById("heartContainer"),

        feedButton:
            document.getElementById("feedBtn"),

        playButton:
            document.getElementById("playBtn"),

        cleanButton:
            document.getElementById("cleanBtn"),

        sleepButton:
            document.getElementById("sleepBtn"),

        renameButton:
            document.getElementById("renameBtn"),

        resetButton:
            document.getElementById("resetBtn"),

        foodTray:
            document.getElementById("foodTray"),

        foodPieces:
            document.getElementById("foodPieces"),

        foodMessage:
            document.getElementById("foodMessage"),

        fishName:
            document.getElementById("fishName"),

        day:
            document.getElementById("day"),

        timeLabel:
            document.getElementById("timeLabel"),

        healthValue:
            document.getElementById("healthValue"),

        hungerValue:
            document.getElementById("hungerValue"),

        affectionValue:
            document.getElementById("affectionValue"),

        energyValue:
            document.getElementById("energyValue"),

        cleanlinessValue:
            document.getElementById("cleanlinessValue"),

        healthBar:
            document.getElementById("healthBar"),

        hungerBar:
            document.getElementById("hungerBar"),

        affectionBar:
            document.getElementById("affectionBar"),

        energyBar:
            document.getElementById("energyBar"),

        cleanlinessBar:
            document.getElementById("cleanlinessBar"),

        moodIcon:
            document.getElementById("moodIcon"),

        moodText:
            document.getElementById("moodText"),

        statusText:
            document.getElementById("statusText"),

        foodCount:
            document.getElementById("foodCount"),

        loveCount:
            document.getElementById("loveCount"),

        sleepWarning:
            document.getElementById("sleepWarning"),

        nameModal:
            document.getElementById("nameModal"),

        nameInput:
            document.getElementById("nameInput"),

        saveName:
            document.getElementById("saveName"),

        cancelName:
            document.getElementById("cancelName"),

        toast:
            document.getElementById("toast")

    };


    /* =================================================
       VERIFY IMPORTANT ELEMENTS
    ================================================= */

    const required = [

        "aquarium",

        "fish",

        "feedButton",

        "playButton",

        "cleanButton",

        "sleepButton",

        "foodTray",

        "foodPieces",

        "heartContainer"

    ];


    for (
        let i = 0;
        i < required.length;
        i++
    ) {

        const name =
            required[i];


        if (
            !elements[name]
        ) {

            console.error(
                "FIN & FRIENDS: Missing element:",
                name
            );

            return;

        }

    }


    /* =================================================
       DEFAULT GAME STATE
    ================================================= */

    const defaultState = {

        name: "BUBBLES",

        day: 1,

        /*
            08:00 in-game start time.
        */

        minutes: 480,

        health: 82,

        hunger: 68,

        affection: 55,

        energy: 76,

        cleanliness: 75,

        foodToday: 0,

        loveToday: 0,

        sleeping: false,

        lastSaved:
            Date.now()

    };


    /* =================================================
       LOAD SAVE
    ================================================= */

    let state =
        loadState();


    /* =================================================
       LOCAL VARIABLES
    ================================================= */

    let foodOpen =
        false;


    let eating =
        false;


    let toastTimer =
        null;


    /* =================================================
       NUMBER CLAMP
    ================================================= */

    function clamp(
        value,
        minimum,
        maximum
    ) {

        return Math.max(
            minimum,
            Math.min(
                maximum,
                value
            )
        );

    }


    /* =================================================
       LOAD GAME
    ================================================= */

    function loadState() {

        try {

            const saved =
                localStorage.getItem(
                    "finFriendsSave"
                );


            if (
                !saved
            ) {

                return {
                    ...defaultState
                };

            }


            const parsed =
                JSON.parse(saved);


            return {

                ...defaultState,

                ...parsed

            };

        }

        catch (error) {

            console.error(
                "Save loading error:",
                error
            );


            return {
                ...defaultState
            };

        }

    }


    /* =================================================
       SAVE GAME
    ================================================= */

    function saveState() {

        state.lastSaved =
            Date.now();


        try {

            localStorage.setItem(
                "finFriendsSave",
                JSON.stringify(state)
            );

        }

        catch (error) {

            console.error(
                "Save error:",
                error
            );

        }

    }


    /* =================================================
       UPDATE BAR
    ================================================= */

    function updateBar(
        bar,
        number,
        value
    ) {

        const safe =
            clamp(
                Number(value) || 0,
                0,
                100
            );


        bar.style.width =
            safe + "%";


        number.textContent =
            Math.round(
                safe
            );

    }


    /* =================================================
       RENDER
    ================================================= */

    function render() {


        /* NAME */

        elements.fishName.textContent =
            state.name;


        /* DAY */

        elements.day.textContent =
            state.day;


        /* TIME */

        const hours =
            Math.floor(
                state.minutes / 60
            );


        const minutes =
            state.minutes % 60;


        elements.timeLabel.textContent =

            String(hours)
                .padStart(2, "0")

            +

            ":"

            +

            String(minutes)
                .padStart(2, "0");


        /* HEALTH */

        updateBar(
            elements.healthBar,
            elements.healthValue,
            state.health
        );


        /* HUNGER */

        updateBar(
            elements.hungerBar,
            elements.hungerValue,
            state.hunger
        );


        /* LOVE */

        updateBar(
            elements.affectionBar,
            elements.affectionValue,
            state.affection
        );


        /* ENERGY */

        updateBar(
            elements.energyBar,
            elements.energyValue,
            state.energy
        );


        /* CLEAN */

        updateBar(
            elements.cleanlinessBar,
            elements.cleanlinessValue,
            state.cleanliness
        );


        /* MISSIONS */

        elements.foodCount.textContent =
            Math.min(
                state.foodToday,
                3
            )
            +
            " / 3";


        elements.loveCount.textContent =
            Math.min(
                state.loveToday,
                3
            )
            +
            " / 3";


        /* SLEEP VISUALS */

        if (
            state.sleeping
        ) {

            elements.fish.classList.add(
                "sleeping"
            );

            elements.fishBlanket.classList.remove(
                "hidden"
            );

            elements.fishPillow.classList.remove(
                "hidden"
            );

            elements.sleepZzz.classList.remove(
                "hidden"
            );

        }

        else {

            elements.fish.classList.remove(
                "sleeping"
            );

            elements.fishBlanket.classList.add(
                "hidden"
            );

            elements.fishPillow.classList.add(
                "hidden"
            );

            elements.sleepZzz.classList.add(
                "hidden"
            );

        }


        updateMood();

        updateSleepWarning();

    }


    /* =================================================
       MOOD
    ================================================= */

    function updateMood() {

        if (
            state.sleeping
        ) {

            elements.moodIcon.textContent =
                "☾";

            elements.moodText.textContent =
                "SLEEPING";

            elements.statusText.textContent =
                "Z Z Z...";

            return;

        }


        const average =

            (
                state.health +
                state.hunger +
                state.affection +
                state.energy +
                state.cleanliness
            ) / 5;


        let icon =
            "♥";


        let mood =
            "HAPPY";


        let message =
            "READY TO PLAY!";


        if (
            state.health <= 25
        ) {

            icon =
                "☹";

            mood =
                "SICK";

            message =
                "I DON'T FEEL GOOD!";

        }

        else if (
            state.hunger <= 20
        ) {

            icon =
                "●";

            mood =
                "HUNGRY";

            message =
                "MY TUMMY IS EMPTY!";

        }

        else if (
            state.energy <= 18
        ) {

            icon =
                "☾";

            mood =
                "SLEEPY";

            message =
                "I NEED A NAP!";

        }

        else if (
            state.cleanliness <= 20
        ) {

            icon =
                "×";

            mood =
                "GRUMPY";

            message =
                "MY TANK IS DIRTY!";

        }

        else if (
            average >= 75
        ) {

            icon =
                "♥";

            mood =
                "DELIGHTED";

            message =
                "I LOVE YOU!";

        }

        else if (
            average >= 50
        ) {

            icon =
                "♡";

            mood =
                "HAPPY";

            message =
                "READY TO PLAY!";

        }

        else {

            icon =
                "…";

            mood =
                "LONELY";

            message =
                "COME PLAY WITH ME!";

        }


        elements.moodIcon.textContent =
            icon;


        elements.moodText.textContent =
            mood;


        elements.statusText.textContent =
            message;

    }


    /* =================================================
       SLEEP WARNING
    ================================================= */

    function updateSleepWarning() {

        if (
            state.sleeping
        ) {

            elements.sleepWarning.classList.add(
                "hidden"
            );

            return;

        }


        if (
            state.energy <= 25
        ) {

            elements.sleepWarning.classList.remove(
                "hidden"
            );

        }

        else {

            elements.sleepWarning.classList.add(
                "hidden"
            );

        }

    }


    /* =================================================
       SPEECH
    ================================================= */

    function speak(
        message
    ) {

        elements.speech.textContent =
            message;

    }


    /* =================================================
       TOAST
    ================================================= */

    function showToast(
        message
    ) {

        elements.toast.textContent =
            message;


        elements.toast.classList.add(
            "show"
        );


        clearTimeout(
            toastTimer
        );


        toastTimer =
            setTimeout(
                function () {

                    elements.toast.classList.remove(
                        "show"
                    );

                },
                1500
            );

    }


    /* =================================================
       CUSTOM CURSOR
    ================================================= */

    if (
        window.matchMedia(
            "(pointer: fine)"
        ).matches
    ) {

        document.addEventListener(
            "mousemove",
            function (event) {

                elements.handCursor.style.left =
                    event.clientX + "px";


                elements.handCursor.style.top =
                    event.clientY + "px";

            }
        );


        document.addEventListener(
            "mousedown",
            function () {

                elements.handCursor.classList.add(
                    "clicking"
                );

            }
        );


        document.addEventListener(
            "mouseup",
            function () {

                elements.handCursor.classList.remove(
                    "clicking"
                );

            }
        );

    }


    /* =================================================
       PET FISH BY CLICKING FISH
    ================================================= */

    elements.fish.addEventListener(
        "click",
        function (event) {

            /*
                If sleeping, clicking the fish
                should wake it instead of petting it.
            */

            if (
                state.sleeping
            ) {

                wakeFish();

                return;

            }


            petFish(
                event.clientX,
                event.clientY
            );

        }
    );


    /* =================================================
       KEYBOARD PETTING
    ================================================= */

    elements.fish.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Enter" ||
                event.key === " "
            ) {

                event.preventDefault();


                if (
                    state.sleeping
                ) {

                    wakeFish();

                }

                else {

                    const rect =
                        elements.fish.getBoundingClientRect();


                    petFish(
                        rect.left +
                        rect.width / 2,

                        rect.top +
                        rect.height / 2
                    );

                }

            }

        }
    );


    /* =================================================
       PET FUNCTION
    ================================================= */

    function petFish(
        x,
        y
    ) {

        /*
            Increase affection.
        */

        state.affection =
            clamp(
                state.affection + 7,
                0,
                100
            );


        /*
            A little happiness gives
            the fish energy.
        */

        state.energy =
            clamp(
                state.energy + 2,
                0,
                100
            );


        /*
            Daily love mission.
        */

        state.loveToday +=
            1;


        /*
            Animate fish.
        */

        elements.fish.classList.remove(
            "petted"
        );


        void elements.fish.offsetWidth;


        elements.fish.classList.add(
            "petted"
        );


        /*
            Create several hearts
            around the fish.
        */

        createPetHearts(
            x,
            y
        );


        /*
            Update state.
        */

        render();

        saveState();


        /*
            Feedback.
        */

        speak(
            "THAT TICKLES! ♥"
        );


        showToast(
            "+7 LOVE"
        );


        /*
            Remove animation class
            after it finishes.
        */

        setTimeout(
            function () {

                elements.fish.classList.remove(
                    "petted"
                );

            },
            600
        );

    }


    /* =================================================
       CREATE PET HEARTS
    ================================================= */

    function createPetHearts(
        x,
        y
    ) {

        const aquariumRect =
            elements.aquarium.getBoundingClientRect();


        /*
            Create 5 hearts.
        */

        for (
            let i = 0;
            i < 5;
            i++
        ) {

            const heart =
                document.createElement(
                    "div"
                );


            heart.className =
                "pet-heart";


            heart.textContent =
                i % 2 === 0
                    ? "♥"
                    : "♡";


            /*
                Position relative to aquarium.
            */

            const randomX =
                x -
                aquariumRect.left +
                (
                    Math.random() * 80
                ) -
                40;


            const randomY =
                y -
                aquariumRect.top +
                (
                    Math.random() * 45
                ) -
                20;


            heart.style.left =
                randomX + "px";


            heart.style.top =
                randomY + "px";


            /*
                Random horizontal movement.
            */

            const movement =
                (
                    Math.random() * 100
                ) - 50;


            heart.style.setProperty(
                "--heart-x",
                movement + "px"
            );


            /*
                Slightly different sizes.
            */

            heart.style.fontSize =
                (
                    17 +
                    Math.random() * 12
                ) +
                "px";


            elements.heartContainer.appendChild(
                heart
            );


            /*
                Remove after animation.
            */

            setTimeout(
                function () {

                    heart.remove();

                },
                1500
            );

        }

    }


    /* =================================================
       FEED BUTTON
    ================================================= */

    elements.feedButton.addEventListener(
        "click",
        function () {

            if (
                state.sleeping
            ) {

                speak(
                    "Z Z Z... I'M ASLEEP!"
                );

                showToast(
                    "FISH IS SLEEPING"
                );

                return;

            }


            if (
                foodOpen
            ) {

                speak(
                    "PICK A SNACK!"
                );

                return;

            }


            createFoodTray();

        }
    );


    /* =================================================
       CREATE FOOD TRAY
    ================================================= */

    function createFoodTray() {

        foodOpen =
            true;


        eating =
            false;


        elements.foodPieces.innerHTML =
            "";


        elements.foodTray.classList.remove(
            "hidden"
        );


        elements.foodMessage.classList.remove(
            "hidden"
        );


        speak(
            "CHOOSE MY FOOD! ●"
        );


        for (
            let i = 0;
            i < 3;
            i++
        ) {

            const food =
                document.createElement(
                    "button"
                );


            food.type =
                "button";


            food.className =
                "food";


            food.setAttribute(
                "aria-label",
                "Feed fish"
            );


            food.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    feedFish(
                        food
                    );

                }
            );


            elements.foodPieces.appendChild(
                food
            );

        }


        showToast(
            "3 SNACKS READY!"
        );

    }


    /* =================================================
       FEED FISH
    ================================================= */

    function feedFish(
        foodElement
    ) {

        if (
            eating ||
            state.sleeping
        ) {

            return;

        }


        if (
            !foodElement ||
            !foodElement.isConnected
        ) {

            return;

        }


        eating =
            true;


        const foodRect =
            foodElement.getBoundingClientRect();


        const fishRect =
            elements.fish.getBoundingClientRect();


        /*
            Move food to fixed screen coordinates.
        */

        foodElement.style.position =
            "fixed";


        foodElement.style.left =
            foodRect.left + "px";


        foodElement.style.top =
            foodRect.top + "px";


        foodElement.style.zIndex =
            "1000";


        foodElement.style.pointerEvents =
            "none";


        document.body.appendChild(
            foodElement
        );


        void foodElement.offsetWidth;


        const targetLeft =

            fishRect.left +
            fishRect.width / 2 -
            12;


        const targetTop =

            fishRect.top +
            fishRect.height / 2 -
            12;


        foodElement.style.transition =

            "left 550ms ease, " +
            "top 550ms ease, " +
            "transform 550ms ease";


        foodElement.style.left =
            targetLeft + "px";


        foodElement.style.top =
            targetTop + "px";


        foodElement.style.transform =
            "rotate(45deg) scale(.4)";


        /*
            Food reaches fish.
        */

        setTimeout(
            function () {

                state.hunger =
                    clamp(
                        state.hunger + 15,
                        0,
                        100
                    );


                state.health =
                    clamp(
                        state.health + 2,
                        0,
                        100
                    );


                state.affection =
                    clamp(
                        state.affection + 1,
                        0,
                        100
                    );


                state.foodToday +=
                    1;


                elements.fish.classList.add(
                    "fish-eating"
                );


                speak(
                    "NOM NOM NOM! ♥"
                );


                showToast(
                    "+15 HUNGER"
                );


                render();

                saveState();

            },
            560
        );


        /*
            Remove food.
        */

        setTimeout(
            function () {

                if (
                    foodElement &&
                    foodElement.isConnected
                ) {

                    foodElement.remove();

                }


                elements.fish.classList.remove(
                    "fish-eating"
                );


                eating =
                    false;


                const remaining =
                    elements.foodPieces.querySelectorAll(
                        ".food"
                    );


                if (
                    remaining.length === 0
                ) {

                    closeFoodTray();

                }

            },
            850
        );

    }


    /* =================================================
       CLOSE FOOD TRAY
    ================================================= */

    function closeFoodTray() {

        foodOpen =
            false;


        elements.foodTray.classList.add(
            "hidden"
        );


        elements.foodMessage.classList.add(
            "hidden"
        );


        speak(
            "THANK YOU! ♥"
        );


        saveState();

    }


    /* =================================================
       PLAY BUTTON
    ================================================= */

    elements.playButton.addEventListener(
        "click",
        function () {

            if (
                state.sleeping
            ) {

                speak(
                    "Z Z Z... I'M ASLEEP!"
                );

                return;

            }


            if (
                state.energy < 15
            ) {

                speak(
                    "Zzz... I'M TOO TIRED!"
                );


                showToast(
                    "NOT ENOUGH ENERGY"
                );


                return;

            }


            state.affection =
                clamp(
                    state.affection + 10,
                    0,
                    100
                );


            state.energy =
                clamp(
                    state.energy - 12,
                    0,
                    100
                );


            state.hunger =
                clamp(
                    state.hunger - 3,
                    0,
                    100
                );


            state.loveToday +=
                1;


            render();

            saveState();


            speak(
                "WHEEEEE! ★"
            );


            showToast(
                "+10 LOVE"
            );


            elements.fish.animate(
                [
                    {
                        transform:
                            "rotate(0deg)"
                    },

                    {
                        transform:
                            "rotate(-8deg)"
                    },

                    {
                        transform:
                            "rotate(8deg)"
                    },

                    {
                        transform:
                            "rotate(-5deg)"
                    },

                    {
                        transform:
                            "rotate(0deg)"
                    }
                ],
                {
                    duration: 700,

                    easing:
                        "steps(5,end)"
                }
            );

        }
    );


    /* =================================================
       CLEAN BUTTON
    ================================================= */

    elements.cleanButton.addEventListener(
        "click",
        function () {

            if (
                state.sleeping
            ) {

                speak(
                    "SHHH... I'M SLEEPING!"
                );

                return;

            }


            state.cleanliness =
                clamp(
                    state.cleanliness + 35,
                    0,
                    100
                );


            state.health =
                clamp(
                    state.health + 6,
                    0,
                    100
                );


            state.affection =
                clamp(
                    state.affection + 3,
                    0,
                    100
                );


            render();

            saveState();


            speak(
                "SPARKLY! ✧"
            );


            showToast(
                "TANK CLEANED!"
            );


            elements.aquarium.animate(
                [
                    {
                        filter:
                            "brightness(1)"
                    },

                    {
                        filter:
                            "brightness(1.4)"
                    },

                    {
                        filter:
                            "brightness(1)"
                    }
                ],
                {
                    duration: 500
                }
            );

        }
    );


    /* =================================================
       SLEEP BUTTON
    ================================================= */

    elements.sleepButton.addEventListener(
        "click",
        function () {

            if (
                state.sleeping
            ) {

                wakeFish();

                return;

            }


            sleepFish();

        }
    );


    /* =================================================
       SLEEP FISH
    ================================================= */

    function sleepFish() {

        if (
            state.sleeping
        ) {

            return;

        }


        state.sleeping =
            true;


        foodOpen =
            false;


        eating =
            false;


        elements.foodTray.classList.add(
            "hidden"
        );


        elements.foodMessage.classList.add(
            "hidden"
        );


        speak(
            "GOODNIGHT... ♥"
        );


        showToast(
            "SLEEP TIGHT!"
        );


        render();

        saveState();


        /*
            Change the button to WAKE.
        */

        elements.sleepButton.innerHTML =
            "☀<span>WAKE</span>";

    }


    /* =================================================
       WAKE FISH
    ================================================= */

    function wakeFish() {

        if (
            !state.sleeping
        ) {

            return;

        }


        state.sleeping =
            false;


        /*
            Sleeping restores energy.
        */

        state.energy =
            clamp(
                state.energy + 45,
                0,
                100
            );


        state.health =
            clamp(
                state.health + 5,
                0,
                100
            );


        render();

        saveState();


        elements.sleepButton.innerHTML =
            "☾<span>SLEEP</span>";


        speak(
            "GOOD MORNING! ☀"
        );


        showToast(
            "+45 ENERGY"
        );

    }


    /* =================================================
       NAME BUTTON
    ================================================= */

    elements.renameButton.addEventListener(
        "click",
        function () {

            elements.nameInput.value =
                state.name;


            elements.nameModal.classList.remove(
                "hidden"
            );


            elements.nameInput.focus();

            elements.nameInput.select();

        }
    );


    /* =================================================
       CANCEL NAME
    ================================================= */

    elements.cancelName.addEventListener(
        "click",
        function () {

            elements.nameModal.classList.add(
                "hidden"
            );

        }
    );


    /* =================================================
       SAVE NAME
    ================================================= */

    elements.saveName.addEventListener(
        "click",
        saveName
    );


    function saveName() {

        const name =
            elements.nameInput.value.trim();


        if (
            name.length === 0
        ) {

            showToast(
                "ENTER A NAME!"
            );

            return;

        }


        state.name =
            name
                .toUpperCase()
                .substring(
                    0,
                    12
                );


        elements.nameModal.classList.add(
            "hidden"
        );


        render();

        saveState();


        speak(
            "I LOVE MY NEW NAME! ♥"
        );


        showToast(
            "NAME SAVED!"
        );

    }


    /* =================================================
       ENTER / ESCAPE NAME
    ================================================= */

    elements.nameInput.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Enter"
            ) {

                saveName();

            }


            if (
                event.key === "Escape"
            ) {

                elements.nameModal.classList.add(
                    "hidden"
                );

            }

        }
    );


    /* =================================================
       RESET
    ================================================= */

    elements.resetButton.addEventListener(
        "click",
        function () {

            const confirmed =
                window.confirm(
                    "RESET YOUR FISH?"
                );


            if (
                !confirmed
            ) {

                return;

            }


            state = {
                ...defaultState
            };


            foodOpen =
                false;


            eating =
                false;


            elements.foodPieces.innerHTML =
                "";


            elements.foodTray.classList.add(
                "hidden"
            );


            elements.foodMessage.classList.add(
                "hidden"
            );


            elements.sleepButton.innerHTML =
                "☾<span>SLEEP</span>";


            render();

            saveState();


            speak(
                "HELLO AGAIN! ♥"
            );


            showToast(
                "GAME RESET!"

            );

        }
    );


    /* =================================================
       GAME TIME
    ==================================================

       IMPORTANT:

       120000 milliseconds = 2 minutes.

       Every 2 real-world minutes:
       +1 in-game hour.

       So:

       2 real minutes = 1 fish hour
       24 real minutes = 12 fish hours
       48 real minutes = 24 fish hours

    ================================================= */

    const GAME_TIME_INTERVAL =
        120000;


    setInterval(
        function () {

            advanceFishTime();

        },
        GAME_TIME_INTERVAL
    );


    /* =================================================
       ADVANCE FISH TIME
    ================================================= */

    function advanceFishTime() {

        /*
            If the fish is asleep,
            time still passes.

            Sleeping is actually useful
            because the fish restores energy.
        */

        state.minutes +=
            60;


        /*
            New day.
        */

        if (
            state.minutes >= 1440
        ) {

            state.minutes -=
                1440;


            state.day +=
                1;


            state.foodToday =
                0;


            state.loveToday =
                0;

        }


        /*
            The fish's needs change each
            in-game hour.

            Sleeping greatly reduces the
            negative effects.
        */

        if (
            state.sleeping
        ) {

            /*
                While sleeping:

                Energy increases.
                Health slowly improves.
                Hunger falls slightly.
            */

            state.energy =
                clamp(
                    state.energy + 12,
                    0,
                    100
                );


            state.health =
                clamp(
                    state.health + 2,
                    0,
                    100
                );


            state.hunger =
                clamp(
                    state.hunger - 2,
                    0,
                    100
                );

        }

        else {

            /*
                Awake fish uses energy.
            */

            state.energy =
                clamp(
                    state.energy - 7,
                    0,
                    100
                );


            /*
                Fish gets hungry.
            */

            state.hunger =
                clamp(
                    state.hunger - 5,
                    0,
                    100
                );


            /*
                Tank gets gradually dirtier.
            */

            state.cleanliness =
                clamp(
                    state.cleanliness - 3,
                    0,
                    100
                );


            /*
                Very low hunger damages health.
            */

            if (
                state.hunger < 20
            ) {

                state.health =
                    clamp(
                        state.health - 3,
                        0,
                        100
                    );

            }


            /*
                Very dirty tank damages health.
            */

            if (
                state.cleanliness < 20
            ) {

                state.health =
                    clamp(
                        state.health - 2,
                        0,
                        100
                    );

            }

        }


        /*
            If energy gets critically low,
            tell the player.
        */

        if (
            state.energy <= 20 &&
            !state.sleeping
        ) {

            speak(
                "I'M REALLY SLEEPY... ☾"
            );

        }


        render();

        saveState();

    }


    /* =================================================
       RANDOM FISH CHAT
    ================================================= */

    setInterval(
        function () {

            if (
                state.sleeping ||
                foodOpen
            ) {

                return;

            }


            const messages = [

                "BLOOP BLOOP!",

                "HELLO HUMAN!",

                "LOOK AT MY FINS!",

                "CAN WE PLAY?",

                "I LOVE YOU ♥",

                "THE WATER IS NICE!",

                "DID YOU SEE THAT?",

                "BLOOP!"

            ];


            const index =
                Math.floor(
                    Math.random() *
                    messages.length
                );


            speak(
                messages[index]
            );

        },
        12000
    );


    /* =================================================
       AUTO SLEEP SUGGESTION
    ================================================= */

    setInterval(
        function () {

            if (
                state.sleeping
            ) {

                return;

            }


            if (
                state.energy <= 10
            ) {

                speak(
                    "I CAN'T STAY AWAKE... ☾"
                );


                /*
                    We don't force sleep immediately.

                    The player still chooses to
                    press SLEEP.

                    This makes sleep a game mechanic
                    rather than an interruption.
                */

            }

        },
        5000
    );


    /* =================================================
       INITIAL RENDER
    ================================================= */

    render();


    console.log(
        "FIN & FRIENDS loaded successfully."
    );

}
