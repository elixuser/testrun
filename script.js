document.addEventListener("DOMContentLoaded", () => {

  "use strict";


  /* ======================================================
     HELPERS
  ====================================================== */

  const $ = (id) =>
    document.getElementById(id);


  const clamp = (
    number,
    min,
    max
  ) =>
    Math.max(
      min,
      Math.min(
        max,
        number
      )
    );


  const rand = (
    min,
    max
  ) =>
    Math.random() *
    (max - min) +
    min;



  /* ======================================================
     ELEMENTS
  ====================================================== */

  const titleScreen =
    $("titleScreen");

  const gameScreen =
    $("gameScreen");

  const aquarium =
    $("aquarium");


  const startGameBtn =
    $("startGameBtn");

  const howToBtn =
    $("howToBtn");

  const settingsBtn =
    $("settingsBtn");


  const transition =
    $("transition");


  const goldie =
    $("goldie");


  const pixelCursor =
    $("pixelCursor");


  const messageBox =
    $("messageBox");


  const foodModal =
    $("foodModal");

  const howToModal =
    $("howToModal");

  const settingsModal =
    $("settingsModal");


  const foodLayer =
    $("foodLayer");

  const particleLayer =
    $("particleLayer");


  const sponge =
    $("sponge");



  /* ======================================================
     DEFAULT GAME DATA
  ====================================================== */

  const DEFAULTS = {

    health: 92,

    hunger: 78,

    happy: 86,

    love: 60,

    clean: 88,

    energy: 82,

    minutes: 480,

    day: 1
  };


  let state = {
    ...DEFAULTS
  };


  let started = false;

  let sleeping = false;

  let cleaning = false;

  let activeFood = null;

  let messageTimer = null;



  /* ======================================================
     FISH POSITION
  ====================================================== */

  const fish = {

    x: 0,

    y: 0,

    tx: 0,

    ty: 0,

    ready: false
  };



  /* ======================================================
     STAT ELEMENTS
  ====================================================== */

  const statUI = {

    health: [
      $("healthBar"),
      $("healthValue")
    ],

    hunger: [
      $("hungerBar"),
      $("hungerValue")
    ],

    happy: [
      $("happyBar"),
      $("happyValue")
    ],

    love: [
      $("loveBar"),
      $("loveValue")
    ],

    clean: [
      $("cleanBar"),
      $("cleanValue")
    ],

    energy: [
      $("energyBar"),
      $("energyValue")
    ]
  };



  /* ======================================================
     FOOD
  ====================================================== */

  const foods = {

    flake: {

      icon: "🌸",

      hunger: 15,

      health: 2,

      happy: 5,

      energy: 1,

      msg:
        "YUMMY! ♥"
    },


    shrimp: {

      icon: "🦐",

      hunger: 24,

      health: 4,

      happy: 10,

      energy: 3,

      msg:
        "GOL-DIE LOVES IT! ♥"
    },


    pellet: {

      icon: "🟡",

      hunger: 19,

      health: 3,

      happy: 6,

      energy: 2,

      msg:
        "CRUNCH CRUNCH! ♥"
    }
  };



  /* ======================================================
     MODALS
  ====================================================== */

  function openModal(element) {

    element.classList.add(
      "open"
    );

    element.setAttribute(
      "aria-hidden",
      "false"
    );
  }


  function closeModal(element) {

    element.classList.remove(
      "open"
    );

    element.setAttribute(
      "aria-hidden",
      "true"
    );
  }



  /* ======================================================
     START GAME
     
     THIS IS THE FIXED START BUTTON.
  ====================================================== */

  startGameBtn.addEventListener(
    "click",
    () => {

      if (started) {
        return;
      }


      started = true;


      /*
        Bubble transition starts.
        IMPORTANT: transition has
        pointer-events:none in CSS,
        so it cannot block clicks.
      */

      transition.classList.add(
        "active"
      );


      window.setTimeout(
        () => {

          /*
            Hide title screen.
          */

          titleScreen.classList.remove(
            "active"
          );


          /*
            Show game.
          */

          gameScreen.classList.add(
            "active"
          );


          gameScreen.setAttribute(
            "aria-hidden",
            "false"
          );


          /*
            Only calculate fish position
            AFTER the aquarium is visible.
          */

          initialiseFish();


          updateUI();

        },
        260
      );


      window.setTimeout(
        () => {

          transition.classList.remove(
            "active"
          );


          showMessage(
            "HI! I'M GOL-DIE! ♥"
          );

        },
        720
      );

    }
  );



  /* ======================================================
     TITLE BUTTONS
  ====================================================== */

  howToBtn.addEventListener(
    "click",
    () => {

      openModal(
        howToModal
      );
    }
  );


  settingsBtn.addEventListener(
    "click",
    () => {

      openModal(
        settingsModal
      );
    }
  );



  /* ======================================================
     FOOD BUTTON
  ====================================================== */

  $("foodBtn").addEventListener(
    "click",
    () => {

      if (sleeping) {

        showMessage(
          "GOL-DIE IS SLEEPING... Z Z Z"
        );

        return;
      }


      if (activeFood) {

        showMessage(
          "THERE'S ALREADY FOOD!"
        );

        return;
      }


      openModal(
        foodModal
      );
    }
  );



  /* ======================================================
     CLOSE MODALS
  ====================================================== */

  document
    .querySelectorAll(
      "[data-close]"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            closeModal(
              $(
                button.dataset.close
              )
            );
          }
        );
      }
    );


  document
    .querySelectorAll(
      ".modal"
    )
    .forEach(
      (modal) => {

        modal.addEventListener(
          "click",
          (event) => {

            if (
              event.target === modal
            ) {

              closeModal(
                modal
              );
            }
          }
        );
      }
    );


  document.addEventListener(
    "keydown",
    (event) => {

      if (
        event.key === "Escape"
      ) {

        document
          .querySelectorAll(
            ".modal.open"
          )
          .forEach(
            closeModal
          );
      }
    }
  );



  /* ======================================================
     CUSTOM PIXEL HAND CURSOR
  ====================================================== */

  let mouseX = -100;

  let mouseY = -100;

  let cursorX = -100;

  let cursorY = -100;


  document.addEventListener(
    "pointermove",
    (event) => {

      /*
        viewport coordinates
      */

      mouseX =
        event.clientX;

      mouseY =
        event.clientY;


      /*
        If hand is over fish,
        show PET label.
      */

      const overFish =
        Boolean(
          event.target.closest(
            "#goldie"
          )
        );


      pixelCursor
        .classList
        .toggle(
          "pet",
          overFish
        );
    }
  );


  document.addEventListener(
    "pointerdown",
    () => {

      pixelCursor
        .classList
        .add(
          "clicking"
        );
    }
  );


  document.addEventListener(
    "pointerup",
    () => {

      pixelCursor
        .classList
        .remove(
          "clicking"
        );
    }
  );


  function cursorLoop() {

    /*
      Slight stepped/smooth movement
      without affecting clicks.
    */

    cursorX +=
      (
        mouseX -
        cursorX
      ) *
      0.42;


    cursorY +=
      (
        mouseY -
        cursorY
      ) *
      0.42;


    pixelCursor.style.transform =
      `translate3d(
        ${cursorX - 10}px,
        ${cursorY - 8}px,
        0
      )`;


    requestAnimationFrame(
      cursorLoop
    );
  }


  cursorLoop();



  /* ======================================================
     FISH MOVEMENT AREA
  ====================================================== */

  function movementBounds() {

    const fishWidth =
      goldie.offsetWidth ||
      170;


    const fishHeight =
      goldie.offsetHeight ||
      110;


    /*
      Keep fish below HUD.
    */

    const top =
      innerWidth <= 760
        ? 195
        : 128;


    /*
      Keep fish above controls/floor.
    */

    const bottomSpace =
      innerWidth <= 760
        ? 125
        : 145;


    return {

      minX: 16,


      maxX:
        Math.max(
          16,

          aquarium.clientWidth -
          fishWidth -
          16
        ),


      minY: top,


      maxY:
        Math.max(
          top,

          aquarium.clientHeight -
          fishHeight -
          bottomSpace
        )
    };
  }



  /* ======================================================
     INITIAL FISH POSITION
     
     STARTS IN MIDDLE OF AQUARIUM.
  ====================================================== */

  function initialiseFish() {

    const bounds =
      movementBounds();


    fish.x =
      clamp(

        aquarium.clientWidth *
        0.5 -

        goldie.offsetWidth *
        0.5,

        bounds.minX,

        bounds.maxX
      );


    fish.y =
      clamp(

        aquarium.clientHeight *
        0.55 -

        goldie.offsetHeight *
        0.5,

        bounds.minY,

        bounds.maxY
      );


    fish.tx =
      fish.x;

    fish.ty =
      fish.y;


    fish.ready =
      true;


    placeFish();

    newTarget();
  }



  /* ======================================================
     PLACE FISH
  ====================================================== */

  function placeFish() {

    const bounds =
      movementBounds();


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



  /* ======================================================
     RANDOM SWIM TARGET
  ====================================================== */

  function newTarget() {

    if (
      !started ||
      sleeping ||
      activeFood
    ) {

      return;
    }


    const bounds =
      movementBounds();


    fish.tx =
      rand(
        bounds.minX,
        bounds.maxX
      );


    fish.ty =
      rand(
        bounds.minY + 8,
        bounds.maxY
      );
  }



  /* ======================================================
     MAIN FISH LOOP
  ====================================================== */

  function fishLoop() {

    if (
      started &&
      fish.ready
    ) {

      const bounds =
        movementBounds();


      /*
        FOOD:
        swim toward food.
      */

      if (activeFood) {

        fish.tx =
          clamp(

            activeFood.x -
            goldie.offsetWidth *
            0.55,

            bounds.minX,

            bounds.maxX
          );


        fish.ty =
          clamp(

            activeFood.y -
            goldie.offsetHeight *
            0.45,

            bounds.minY,

            bounds.maxY
          );
      }


      /*
        SLEEP:
        swim to bed.
      */

      else if (sleeping) {

        fish.tx =
          clamp(

            aquarium.clientWidth -
            goldie.offsetWidth -
            90,

            bounds.minX,

            bounds.maxX
          );


        fish.ty =
          bounds.maxY;
      }


      const dx =
        fish.tx -
        fish.x;


      const dy =
        fish.ty -
        fish.y;


      const distance =
        Math.hypot(
          dx,
          dy
        );


      let speed =
        0.75;


      if (
        state.energy < 25
      ) {

        speed *= 0.45;
      }


      if (
        state.happy < 25
      ) {

        speed *= 0.65;
      }


      if (activeFood) {

        speed *= 2.5;
      }


      if (sleeping) {

        speed *= 1.55;
      }


      if (
        distance > 2
      ) {

        fish.x +=
          dx /
          distance *
          speed;


        fish.y +=
          dy /
          distance *
          speed;


        /*
          Turn fish around.
        */

        if (
          dx < -1
        ) {

          goldie
            .classList
            .add(
              "facing-left"
            );
        }

        else if (
          dx > 1
        ) {

          goldie
            .classList
            .remove(
              "facing-left"
            );
        }


        placeFish();
      }


      else if (sleeping) {

        goldie
          .classList
          .add(
            "asleep"
          );
      }


      updateFood();
    }


    requestAnimationFrame(
      fishLoop
    );
  }


  fishLoop();



  /* ======================================================
     NEW SWIM TARGET EVERY FEW SECONDS
  ====================================================== */

  setInterval(
    () => {

      if (
        started &&
        !sleeping &&
        !activeFood
      ) {

        newTarget();
      }

    },
    3200
  );



  /* ======================================================
     RESIZE PROTECTION
  ====================================================== */

  window.addEventListener(
    "resize",
    () => {

      if (
        !fish.ready
      ) {

        return;
      }


      const bounds =
        movementBounds();


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


      fish.tx =
        clamp(
          fish.tx,
          bounds.minX,
          bounds.maxX
        );


      fish.ty =
        clamp(
          fish.ty,
          bounds.minY,
          bounds.maxY
        );


      placeFish();
    }
  );



  /* ======================================================
     PETTING
     
     CLICKING GOL-DIE = PET
  ====================================================== */

  goldie.addEventListener(
    "click",
    (event) => {

      event.stopPropagation();


      if (
        !started
      ) {

        return;
      }


      if (sleeping) {

        showMessage(
          "SHHH... GOL-DIE IS SLEEPING!"
        );

        return;
      }


      /*
        Increase affection.
      */

      state.love =
        clamp(
          state.love + 5,
          0,
          100
        );


      state.happy =
        clamp(
          state.happy + 4,
          0,
          100
        );


      /*
        Restart wiggle animation.
      */

      goldie
        .classList
        .remove(
          "petted"
        );


      void goldie.offsetWidth;


      goldie
        .classList
        .add(
          "petted"
        );


      particles(
        "♥",
        6,
        "#fish"
      );


      particles(
        "✦",
        4,
        "#fish"
      );


      showMessage(
        "GOL-DIE LOVES YOU! ♥"
      );


      updateUI();


      setTimeout(
        () => {

          goldie
            .classList
            .remove(
              "petted"
            );

        },
        500
      );
    }
  );



  /* ======================================================
     FOOD CHOICES
  ====================================================== */

  document
    .querySelectorAll(
      ".food-choice"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            closeModal(
              foodModal
            );


            dropFood(
              button.dataset.food
            );
          }
        );
      }
    );



  /* ======================================================
     DROP FOOD
  ====================================================== */

  function dropFood(type) {

    if (
      activeFood ||
      !foods[type]
    ) {

      return;
    }


    const element =
      document.createElement(
        "div"
      );


    element.className =
      "falling-food";


    element.textContent =
      foods[type].icon;


    foodLayer.appendChild(
      element
    );


    activeFood = {

      type,

      el: element,


      x:
        clamp(

          fish.x +

          goldie.offsetWidth *
          0.55 +

          rand(
            -110,
            110
          ),

          25,

          aquarium.clientWidth -
          45
        ),


      y:
        clamp(

          fish.y -

          rand(
            90,
            150
          ),

          105,

          aquarium.clientHeight -
          220
        ),


      speed: 0.62
    };


    positionFood();


    showMessage(
      "SNACK TIME! 🍎"
    );
  }



  function positionFood() {

    if (
      !activeFood
    ) {

      return;
    }


    activeFood.el.style.left =
      `${activeFood.x}px`;


    activeFood.el.style.top =
      `${activeFood.y}px`;
  }



  /* ======================================================
     FOOD MOVEMENT
  ====================================================== */

  function updateFood() {

    if (
      !activeFood
    ) {

      return;
    }


    activeFood.y +=
      activeFood.speed;


    positionFood();


    const fishX =
      fish.x +

      goldie.offsetWidth *
      0.68;


    const fishY =
      fish.y +

      goldie.offsetHeight *
      0.5;


    /*
      Fish reached food.
    */

    if (
      Math.hypot(

        activeFood.x -
        fishX,

        activeFood.y -
        fishY

      ) < 45
    ) {

      eatFood();

      return;
    }


    /*
      Food reaches bottom.
    */

    const floorPoint =
      aquarium.clientHeight -

      (
        innerWidth <= 760
          ? 84
          : 105
      );


    if (
      activeFood.y >
      floorPoint
    ) {

      activeFood.el.remove();

      activeFood = null;


      state.clean =
        clamp(
          state.clean - 3,
          0,
          100
        );


      showMessage(
        "OH NO! THE FOOD SANK!"
      );


      updateUI();

      newTarget();
    }
  }



  /* ======================================================
     EATING
  ====================================================== */

  function eatFood() {

    const data =
      foods[
        activeFood.type
      ];


    activeFood.el.remove();

    activeFood = null;


    state.hunger =
      clamp(

        state.hunger +
        data.hunger,

        0,

        100
      );


    state.health =
      clamp(

        state.health +
        data.health,

        0,

        100
      );


    state.happy =
      clamp(

        state.happy +
        data.happy,

        0,

        100
      );


    state.energy =
      clamp(

        state.energy +
        data.energy,

        0,

        100
      );


    goldie
      .classList
      .add(
        "eating"
      );


    particles(
      "♥",
      5,
      "#fish"
    );


    particles(
      "✦",
      5,
      "#fish"
    );


    showMessage(
      data.msg
    );


    updateUI();


    setTimeout(
      () => {

        goldie
          .classList
          .remove(
            "eating"
          );


        newTarget();

      },
      750
    );
  }



  /* ======================================================
     CLEAN
  ====================================================== */

  $("cleanBtn").addEventListener(
    "click",
    () => {

      if (cleaning) {

        return;
      }


      if (sleeping) {

        showMessage(
          "LET GOL-DIE SLEEP! ♥"
        );

        return;
      }


      cleaning = true;


      sponge
        .classList
        .remove(
          "go"
        );


      void sponge.offsetWidth;


      sponge
        .classList
        .add(
          "go"
        );


      /*
        Cleaning bubbles.
      */

      for (
        let i = 0;
        i < 16;
        i++
      ) {

        setTimeout(
          () => {

            particles(
              "",
              1,
              "#tank",
              true
            );

          },
          i * 60
        );
      }


      setTimeout(
        () => {

          state.clean =
            clamp(
              state.clean + 35,
              0,
              100
            );


          state.happy =
            clamp(
              state.happy + 5,
              0,
              100
            );


          showMessage(
            "SPARKLY CLEAN! ✨"
          );


          updateUI();

        },
        700
      );


      setTimeout(
        () => {

          sponge
            .classList
            .remove(
              "go"
            );


          cleaning = false;

        },
        1550
      );
    }
  );



  /* ======================================================
     SLEEP BUTTON
  ====================================================== */

  $("sleepBtn").addEventListener(
    "click",
    () => {

      if (sleeping) {

        wakeUp();
      }

      else {

        sleepNow();
      }
    }
  );



  function sleepNow() {

    if (activeFood) {

      activeFood.el.remove();

      activeFood = null;
    }


    sleeping = true;


    aquarium
      .classList
      .add(
        "sleeping"
      );


    $("sleepLabel").textContent =
      "WAKE";


    $("sleepIcon").textContent =
      "☀";


    showMessage(
      "SWEET DREAMS, GOL-DIE! ☾"
    );
  }



  function wakeUp() {

    sleeping = false;


    aquarium
      .classList
      .remove(
        "sleeping"
      );


    goldie
      .classList
      .remove(
        "asleep"
      );


    $("sleepLabel").textContent =
      "SLEEP";


    $("sleepIcon").textContent =
      "☾";


    state.happy =
      clamp(
        state.happy + 3,
        0,
        100
      );


    particles(
      "✦",
      7,
      "#fish"
    );


    showMessage(
      "GOOD MORNING! ☀"
    );


    newTarget();

    updateUI();
  }



  /* ======================================================
     SLEEP RECOVERY
  ====================================================== */

  setInterval(
    () => {

      if (
        !started ||
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

    },
    2000
  );



  /* ======================================================
     PARTICLES
  ====================================================== */

  function particles(
    symbol,
    count,
    origin,
    bubble = false
  ) {

    for (
      let i = 0;
      i < count;
      i++
    ) {

      const particle =
        document.createElement(
          "span"
        );


      particle.className =
        "particle" +

        (
          bubble
            ? " bubble-particle"
            : ""
        );


      particle.textContent =
        bubble
          ? ""
          : symbol;


      let x;

      let y;


      if (
        origin === "#fish"
      ) {

        x =
          fish.x +

          goldie.offsetWidth *
          0.55 +

          rand(
            -35,
            35
          );


        y =
          fish.y +

          goldie.offsetHeight *
          0.45 +

          rand(
            -15,
            25
          );
      }


      else {

        x =
          rand(
            20,
            aquarium.clientWidth -
            20
          );


        y =
          rand(
            150,
            aquarium.clientHeight -
            120
          );
      }


      particle.style.left =
        `${x}px`;


      particle.style.top =
        `${y}px`;


      particle.style.setProperty(
        "--px",

        `${rand(
          -45,
          45
        )}px`
      );


      particleLayer
        .appendChild(
          particle
        );


      setTimeout(
        () => {

          particle.remove();

        },
        950
      );
    }
  }



  /* ======================================================
     MESSAGE
  ====================================================== */

  function showMessage(
    text
  ) {

    clearTimeout(
      messageTimer
    );


    messageBox.textContent =
      text;


    messageBox
      .classList
      .remove(
        "show"
      );


    void messageBox.offsetWidth;


    messageBox
      .classList
      .add(
        "show"
      );


    messageTimer =
      setTimeout(
        () => {

          messageBox
            .classList
            .remove(
              "show"
            );

        },
        1700
      );
  }



  /* ======================================================
     GAME CLOCK

     2 REAL MINUTES = 1 GAME HOUR

     2 REAL SECONDS = 1 GAME MINUTE
  ====================================================== */

  setInterval(
    () => {

      if (
        !started
      ) {

        return;
      }


      state.minutes++;


      if (
        state.minutes >= 1440
      ) {

        state.minutes = 0;

        state.day++;
      }


      updateClock();

      updateDayNight();

    },
    2000
  );



  /* ======================================================
     STAT DECAY
  ====================================================== */

  setInterval(
    () => {

      if (
        !started
      ) {

        return;
      }


      if (
        !sleeping
      ) {

        state.hunger =
          clamp(
            state.hunger -
            0.9,
            0,
            100
          );


        state.clean =
          clamp(
            state.clean -
            0.5,
            0,
            100
          );


        state.energy =
          clamp(
            state.energy -
            0.45,
            0,
            100
          );


        state.happy =
          clamp(
            state.happy -
            0.25,
            0,
            100
          );
      }


      /*
        Hunger consequences
      */

      if (
        state.hunger < 20
      ) {

        state.health =
          clamp(
            state.health -
            0.65,
            0,
            100
          );
      }


      /*
        Dirty tank consequences
      */

      if (
        state.clean < 20
      ) {

        state.health =
          clamp(
            state.health -
            0.5,
            0,
            100
          );
      }


      updateUI();

      save();

    },
    15000
  );



  /* ======================================================
     CLOCK DISPLAY
  ====================================================== */

  function updateClock() {

    const hour24 =
      Math.floor(
        state.minutes /
        60
      );


    const minutes =
      Math.floor(
        state.minutes %
        60
      );


    const period =
      hour24 >= 12
        ? "PM"
        : "AM";


    let hour =
      hour24 % 12;


    if (
      hour === 0
    ) {

      hour = 12;
    }


    $("clockText").textContent =

      `${String(hour).padStart(
        2,
        "0"
      )}:` +

      `${String(minutes).padStart(
        2,
        "0"
      )} ` +

      period;


    $("dayText").textContent =
      `DAY ${state.day}`;
  }



  /* ======================================================
     DAY / NIGHT
  ====================================================== */

  function updateDayNight() {

    const hour =
      Math.floor(
        state.minutes /
        60
      );


    const night =
      hour >= 20 ||
      hour < 6;


    aquarium
      .classList
      .toggle(

        "night",

        night &&
        !sleeping
      );
  }



  /* ======================================================
     MOOD
  ====================================================== */

  function updateMood() {

    goldie
      .classList
      .toggle(

        "hungry",

        state.hunger < 28 &&
        !sleeping
      );


    let mood =
      "HAPPY!";


    if (sleeping) {

      mood =
        "SLEEPING...";
    }


    else if (
      state.health < 25
    ) {

      mood =
        "FEELING POORLY";
    }


    else if (
      state.hunger < 20
    ) {

      mood =
        "VERY HUNGRY!";
    }


    else if (
      state.energy < 20
    ) {

      mood =
        "SLEEPY...";
    }


    else if (
      state.clean < 20
    ) {

      mood =
        "MESSY TANK!";
    }


    else if (
      state.happy < 25
    ) {

      mood =
        "NEEDS LOVE";
    }


    else if (
      state.love > 85
    ) {

      mood =
        "BEST FRIEND ♥";
    }


    else if (
      state.happy > 85
    ) {

      mood =
        "SUPER HAPPY!";
    }


    $("moodText").textContent =
      mood;
  }



  /* ======================================================
     UPDATE UI
  ====================================================== */

  function updateUI() {

    Object
      .entries(
        statUI
      )
      .forEach(
        (
          [
            key,
            [
              bar,
              value
            ]
          ]
        ) => {

          state[key] =
            clamp(
              Number(
                state[key]
              ) || 0,
              0,
              100
            );


          bar.style.width =
            `${state[key]}%`;


          value.textContent =
            Math.round(
              state[key]
            );
        }
      );


    updateMood();

    updateClock();

    updateDayNight();
  }



  /* ======================================================
     SAVE GAME
  ====================================================== */

  function save() {

    try {

      localStorage.setItem(

        "goldieSaveV2",

        JSON.stringify(
          state
        )
      );

    }

    catch (error) {

      console.log(
        "Save unavailable."
      );
    }
  }



  /* ======================================================
     LOAD GAME
  ====================================================== */

  function load() {

    try {

      const raw =
        localStorage.getItem(
          "goldieSaveV2"
        );


      if (raw) {

        state = {

          ...DEFAULTS,

          ...JSON.parse(
            raw
          )
        };
      }

    }

    catch (error) {

      state = {
        ...DEFAULTS
      };
    }


    Object
      .keys(
        statUI
      )
      .forEach(
        (key) => {

          state[key] =
            clamp(

              Number(
                state[key]
              ) ||
              DEFAULTS[key],

              0,

              100
            );
        }
      );


    state.day =
      Math.max(
        1,

        Number(
          state.day
        ) || 1
      );


    state.minutes =
      clamp(

        Number(
          state.minutes
        ) || 480,

        0,

        1439
      );
  }



  /* ======================================================
     SETTINGS
  ====================================================== */

  $("motionToggle")
    .addEventListener(
      "change",
      (event) => {

        document.body
          .classList
          .toggle(

            "reduced-motion",

            event.target.checked
          );
      }
    );



  /* ======================================================
     RESET
  ====================================================== */

  $("resetBtn")
    .addEventListener(
      "click",
      () => {

        state = {
          ...DEFAULTS
        };


        sleeping =
          false;


        aquarium
          .classList
          .remove(
            "sleeping",
            "night"
          );


        goldie
          .classList
          .remove(
            "asleep",
            "hungry",
            "petted",
            "eating"
          );


        $("sleepLabel")
          .textContent =
          "SLEEP";


        $("sleepIcon")
          .textContent =
          "☾";


        localStorage.removeItem(
          "goldieSaveV2"
        );


        closeModal(
          settingsModal
        );


        updateUI();


        if (started) {

          initialiseFish();


          showMessage(
            "A FRESH START! ♥"
          );
        }
      }
    );



  /* ======================================================
     SAVE WHEN LEAVING PAGE
  ====================================================== */

  window.addEventListener(
    "beforeunload",
    save
  );



  /* ======================================================
     LOAD
  ====================================================== */

  load();

  updateUI();

});
