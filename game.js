/* =====================================================
   FIN & FRIENDS
   RETRO FISH CARE GAME
   VERSION 3 - STABLE INTERACTION SYSTEM
===================================================== */


/*
    IMPORTANT:

    The entire game is started from DOMContentLoaded.

    This guarantees that:

    1. index.html has finished loading.
    2. Every button exists.
    3. Every stat bar exists.
    4. The fish exists.
    5. Event listeners can safely be attached.
*/


document.addEventListener(
    "DOMContentLoaded",
    function () {

        startGame();

    }
);


/* =====================================================
   START GAME
===================================================== */

function startGame() {

    /*
        Find every HTML element that the game needs.
    */

    const elements = {

        feedButton:
            document.getElementById("feedBtn"),

        playButton:
            document.getElementById("playBtn"),

        cleanButton:
            document.getElementById("cleanBtn"),

        petButton:
            document.getElementById("petBtn"),

        resetButton:
            document.getElementById("resetBtn"),

        renameButton:
            document.getElementById("renameBtn"),

        saveNameButton:
            document.getElementById("saveName"),

        cancelNameButton:
            document.getElementById("cancelName"),

        nameModal:
            document.getElementById("nameModal"),

        nameInput:
            document.getElementById("nameInput"),

        fish:
            document.getElementById("fish"),

        fishMouth:
            document.getElementById("fishMouth"),

        foodTray:
            document.getElementById("foodTray"),

        foodPieces:
            document.getElementById("foodPieces"),

        foodMessage:
            document.getElementById("foodMessage"),

        aquarium:
            document.getElementById("aquarium"),

        speech:
            document.getElementById("speech"),

        toast:
            document.getElementById("toast"),

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

        healthBar:
            document.getElementById("healthBar"),

        hungerBar:
            document.getElementById("hungerBar"),

        affectionBar:
            document.getElementById("affectionBar"),

        energyBar:
            document.getElementById("energyBar"),

        moodIcon:
            document.getElementById("moodIcon"),

        moodText:
            document.getElementById("moodText"),

        statusText:
            document.getElementById("statusText"),

        foodCount:
            document.getElementById("foodCount"),

        loveCount:
            document.getElementById("loveCount")

    };


    /*
        Before doing anything else,
        verify that the important buttons exist.

        This makes errors much easier to find.
    */

    const requiredElements = [

        "feedButton",
        "playButton",
        "cleanButton",
        "petButton",
        "fish",
        "foodTray",
        "foodPieces"

    ];


    for (
        let i = 0;
        i < requiredElements.length;
        i++
    ) {

        const name =
            requiredElements[i];


        if (
            !elements[name]
        ) {

            console.error(
                "FIN & FRIENDS ERROR: Missing HTML element:",
                name
            );

            return;

        }

    }


    /* =================================================
       GAME STATE
    ================================================= */

    const defaultState = {

        name: "BUBBLES",

        day: 1,

        minutes: 480,

        health: 82,

        hunger: 68,

        affection: 55,

        energy: 76,

        cleanliness: 75,

        foodToday: 0,

        loveToday: 0,

        lastSaved: Date.now()

    };


    let state =
        loadState();


    /*
        This tells the feeding system whether
        food is currently available.
    */

    let foodOpen = false;


    /*
        This prevents the player from clicking
        multiple food pieces at exactly the same time.
    */

    let eating = false;


    let toastTimer = null;


    /* =================================================
       HELPER: CLAMP NUMBER
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
       LOAD SAVE
    ================================================= */

    function loadState() {

        try {

            const saved =
                localStorage.getItem(
                    "finFriendsSave"
                );


            if (
                saved === null
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
                "Could not load save:",
                error
            );


            return {
                ...defaultState
            };

        }

    }


    /* =================================================
       SAVE
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
                "Could not save game:",
                error
            );

        }

    }


    /* =================================================
       UPDATE BAR
    ================================================= */

    function updateBar(
        barElement,
        valueElement,
        value
    ) {

        const safeValue =
            clamp(
                Number(value) || 0,
                0,
                100
            );


        barElement.style.width =
            safeValue + "%";


        valueElement.textContent =
            Math.round(
                safeValue
            );

    }


    /* =================================================
       RENDER EVERYTHING
    ================================================= */

    function render() {

        /*
            Name
        */

        elements.fishName.textContent =
            state.name;


        /*
            Day
        */

        elements.day.textContent =
            state.day;


        /*
            Clock
        */

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


        /*
            Health
        */

        updateBar(
            elements.healthBar,
            elements.healthValue,
            state.health
        );


        /*
            Hunger
        */

        updateBar(
            elements.hungerBar,
            elements.hungerValue,
            state.hunger
        );


        /*
            Affection
        */

        updateBar(
            elements.affectionBar,
            elements.affectionValue,
            state.affection
        );


        /*
            Energy
        */

        updateBar(
            elements.energyBar,
            elements.energyValue,
            state.energy
        );


        /*
            Missions
        */

        elements.foodCount.textContent =
            Math.min(
                state.foodToday,
                3
            ) +
            " / 3";


        elements.loveCount.textContent =
            Math.min(
                state.loveToday,
                3
            ) +
            " / 3";


        updateMood();

    }


    /* =================================================
       MOOD
    ================================================= */

    function updateMood() {

        const average =

            (
                state.health +
                state.hunger +
                state.affection +
                state.energy
            ) / 4;


        let icon = "♥";

        let mood = "HAPPY";

        let message =
            "READY TO PLAY!";


        if (
            state.health <= 25
        ) {

            icon = "☹";

            mood = "SICK";

            message =
                "I DON'T FEEL GOOD!";

        }

        else if (
            state.hunger <= 20
        ) {

            icon = "●";

            mood = "HUNGRY";

            message =
                "MY TUMMY IS EMPTY!";

        }

        else if (
            state.cleanliness <= 25
        ) {

            icon = "×";

            mood = "GRUMPY";

            message =
                "MY TANK IS DIRTY!";

        }

        else if (
            average >= 75
        ) {

            icon = "♥";

            mood = "DELIGHTED";

            message =
                "I LOVE YOU!";

        }

        else if (
            average >= 50
        ) {

            icon = "♡";

            mood = "HAPPY";

            message =
                "READY TO PLAY!";

        }

        else {

            icon = "…";

            mood = "LONELY";

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
                1600
            );

    }


    /* =================================================
       BUTTON: FEED
    ================================================= */

    elements.feedButton.addEventListener(
        "click",
        function () {

            handleFeedButton();

        }
    );


    function handleFeedButton() {

        /*
            If food is already on screen,
            don't create another tray.
        */

        if (
            foodOpen
        ) {

            speak(
                "CHOOSE A SNACK!"
            );

            return;

        }


        createFoodTray();

    }


    /* =================================================
       CREATE FOOD
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


        /*
            Create exactly three
            clickable food pieces.
        */

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


            /*
                THIS IS THE IMPORTANT EVENT:

                Clicking the food calls
                feedFish().
            */

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

        /*
            Don't allow two foods to
            be eaten simultaneously.
        */

        if (
            eating
        ) {

            return;

        }


        /*
            Make sure the clicked element
            still exists.
        */

        if (
            !foodElement ||
            !foodElement.isConnected
        ) {

            return;

        }


        eating =
            true;


        /*
            Get the position of the
            food before moving it.
        */

        const foodRect =
            foodElement.getBoundingClientRect();


        /*
            Get the position of the fish.
        */

        const fishRect =
            elements.fish.getBoundingClientRect();


        /*
            Turn the food into a floating
            fixed-position object.
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


        /*
            Move the food into the body
            so aquarium positioning cannot
            interfere with it.
        */

        document.body.appendChild(
            foodElement
        );


        /*
            Force the browser to apply
            the starting position before
            changing it.
        */

        void foodElement.offsetWidth;


        /*
            Calculate the target position.
        */

        const targetLeft =

            fishRect.left +
            (
                fishRect.width / 2
            ) -
            12;


        const targetTop =

            fishRect.top +
            (
                fishRect.height / 2
            ) -
            12;


        /*
            Animate the food toward
            the fish.
        */

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
            After the food reaches the fish,
            actually update the GAME STATE.
        */

        setTimeout(
            function () {

                /*
                    IMPORTANT:

                    The actual hunger increase
                    happens here, not when the
                    FEED button is pressed.
                */

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


                /*
                    Open fish mouth.
                */

                elements.fish.classList.add(
                    "fish-eating"
                );


                speak(
                    "NOM NOM NOM! ♥"
                );


                showToast(
                    "+15 HUNGER"
                );


                /*
                    Update bars immediately.
                */

                render();


                /*
                    Save immediately.
                */

                saveState();

            },
            560
        );


        /*
            Remove the food after
            the eating animation.
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


                /*
                    Allow another food
                    to be selected.
                */

                eating =
                    false;


                /*
                    Check whether any
                    food pieces remain.
                */

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
       BUTTON: PLAY
    ================================================= */

    elements.playButton.addEventListener(
        "click",
        function () {

            playWithFish();

        }
    );


    function playWithFish() {

        /*
            Playing requires energy.
        */

        if (
            state.energy < 15
        ) {

            speak(
                "Zzz... I'M TIRED!"
            );


            showToast(
                "NOT ENOUGH ENERGY"
            );


            return;

        }


        /*
            GAME STATE CHANGES.
        */

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


        /*
            Update screen.
        */

        render();


        /*
            Save.
        */

        saveState();


        /*
            Feedback.
        */

        speak(
            "WHEEEEE! ★"
        );


        showToast(
            "+10 LOVE"
        );


        /*
            Animate the fish.
        */

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
                    "steps(5, end)"
            }
        );

    }


    /* =================================================
       BUTTON: CLEAN
    ================================================= */

    elements.cleanButton.addEventListener(
        "click",
        function () {

            cleanTank();

        }
    );


    function cleanTank() {

        /*
            Improve cleanliness.
        */

        state.cleanliness =
            clamp(
                state.cleanliness + 35,
                0,
                100
            );


        /*
            Cleaning also slightly
            improves health.
        */

        state.health =
            clamp(
                state.health + 6,
                0,
                100
            );


        /*
            Fish likes having a clean home.
        */

        state.affection =
            clamp(
                state.affection + 3,
                0,
                100
            );


        /*
            Update game.
        */

        render();


        saveState();


        /*
            Feedback.
        */

        speak(
            "SPARKLY! ✧"
        );


        showToast(
            "TANK CLEANED!"
        );


        /*
            Visual flash.

            This animation is NOT required
            for the actual cleaning to work.
        */

        elements.aquarium.animate(
            [
                {
                    filter:
                        "brightness(1)"
                },

                {
                    filter:
                        "brightness(1.5)"
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


    /* =================================================
       BUTTON: PET
    ================================================= */

    elements.petButton.addEventListener(
        "click",
        function () {

            petFish();

        }
    );


    function petFish() {

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
            Small energy bonus.
        */

        state.energy =
            clamp(
                state.energy + 2,
                0,
                100
            );


        /*
            Daily love counter.
        */

        state.loveToday +=
            1;


        /*
            Update immediately.
        */

        render();


        /*
            Save immediately.
        */

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
            Fish wiggle.
        */

        elements.fish.animate(
            [
                {
                    transform:
                        "rotate(0deg)"
                },

                {
                    transform:
                        "rotate(-10deg)"
                },

                {
                    transform:
                        "rotate(10deg)"
                },

                {
                    transform:
                        "rotate(-6deg)"
                },

                {
                    transform:
                        "rotate(0deg)"
                }
            ],
            {
                duration: 550,

                easing:
                    "steps(5, end)"
            }
        );

    }


    /* =================================================
       RENAME BUTTON
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

    elements.cancelNameButton.addEventListener(
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

    elements.saveNameButton.addEventListener(
        "click",
        function () {

            saveName();

        }
    );


    function saveName() {

        const enteredName =
            elements.nameInput.value.trim();


        if (
            enteredName.length === 0
        ) {

            showToast(
                "ENTER A NAME!"
            );

            return;

        }


        state.name =
            enteredName
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
            "THAT'S A CUTE NAME! ♥"
        );


        showToast(
            "NAME SAVED!"
        );

    }


    /* =================================================
       NAME KEYBOARD
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
       RESET BUTTON
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
       GAME CLOCK
    ================================================= */

    setInterval(
        function () {

            advanceTime();

        },
        60000
    );


    function advanceTime() {

        /*
            10 minutes pass every real minute.
        */

        state.minutes +=
            10;


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
            Fish gets gradually hungry.
        */

        state.hunger =
            clamp(
                state.hunger - 1,
                0,
                100
            );


        /*
            Energy slowly decreases.
        */

        state.energy =
            clamp(
                state.energy - .5,
                0,
                100
            );


        /*
            Tank slowly becomes dirty.
        */

        state.cleanliness =
            clamp(
                state.cleanliness - .5,
                0,
                100
            );


        /*
            Hunger that gets too low
            eventually affects health.
        */

        if (
            state.hunger < 20
        ) {

            state.health =
                clamp(
                    state.health - 1,
                    0,
                    100
                );

        }


        /*
            Dirty water affects health.
        */

        if (
            state.cleanliness < 20
        ) {

            state.health =
                clamp(
                    state.health - 1,
                    0,
                    100
                );

        }


        render();

        saveState();

    }


    /* =================================================
       RANDOM FISH TALK
    ================================================= */

    setInterval(
        function () {

            /*
                Don't interrupt the feeding
                interface.
            */

            if (
                foodOpen
            ) {

                return;

            }


            const messages = [

                "BLOOP BLOOP!",

                "LOOK AT MY FINS!",

                "HELLO HUMAN!",

                "CAN WE PLAY?",

                "I LOVE MY TANK ♥",

                "THE WATER IS NICE!",

                "DID YOU SEE THAT?",

                "♥ ♥ ♥"

            ];


            const randomIndex =
                Math.floor(
                    Math.random() *
                    messages.length
                );


            speak(
                messages[randomIndex]
            );

        },
        12000
    );


    /* =================================================
       FIRST RENDER
    ================================================= */

    render();


    /*
        Give the player an immediate
        confirmation that the game
        has initialized.
    */

    console.log(
        "FIN & FRIENDS loaded successfully."
    );

}
