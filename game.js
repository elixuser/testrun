```javascript
/* =========================================
   FIN & FRIENDS
   RETRO FISH CARE GAME
========================================= */


/* =========================================
   SAVE SYSTEM
========================================= */

const SAVE_KEY =
  "fin-and-friends-save-v1";


/* =========================================
   DEFAULT FISH
========================================= */

const defaultState = {

  name: "Bubbles",

  day: 1,

  minutes: 8 * 60,

  health: 82,

  hunger: 68,

  affection: 55,

  energy: 76,

  cleanliness: 72,

  lastSaved: Date.now()

};


let state = loadState();

let actionLock = false;


/* =========================================
   HELPER
========================================= */

function $(id) {
  return document.getElementById(id);
}


function clamp(
  number,
  min = 0,
  max = 100
) {

  return Math.max(
    min,
    Math.min(max, number)
  );

}


/* =========================================
   LOAD GAME
========================================= */

function loadState() {

  try {

    const raw =
      localStorage.getItem(SAVE_KEY);


    if (!raw) {

      return {
        ...defaultState
      };

    }


    const saved = {

      ...defaultState,

      ...JSON.parse(raw)

    };


    /*
      Work out how long the player
      has been away.
    */

    const elapsedMinutes =
      Math.floor(
        (Date.now() - saved.lastSaved)
        / 60000
      );


    if (elapsedMinutes > 0) {

      simulateTime(
        saved,
        Math.min(
          elapsedMinutes,
          240
        )
      );

      saved.lastSaved =
        Date.now();

    }


    return saved;

  }

  catch {

    return {
      ...defaultState
    };

  }

}


/* =========================================
   SAVE GAME
========================================= */

function save() {

  state.lastSaved =
    Date.now();

  localStorage.setItem(
    SAVE_KEY,
    JSON.stringify(state)
  );

}


/* =========================================
   TIME SIMULATION
========================================= */

function simulateTime(
  fish,
  minutes
) {

  const chunks =
    Math.max(
      1,
      Math.floor(minutes / 10)
    );


  for (
    let i = 0;
    i < chunks;
    i++
  ) {

    /*
      Advance clock.
    */

    fish.minutes += 10;


    if (
      fish.minutes >=
      24 * 60
    ) {

      fish.minutes -=
        24 * 60;

      fish.day++;

    }


    /*
      Fish slowly gets hungry.
    */

    fish.hunger =
      clamp(
        fish.hunger - 1.6
      );


    /*
      Energy decreases.
    */

    fish.energy =
      clamp(
        fish.energy - .65
      );


    /*
      Aquarium slowly gets dirty.
    */

    fish.cleanliness =
      clamp(
        fish.cleanliness - .75
      );


    /*
      Hunger and dirt affect health.
    */

    if (
      fish.hunger < 30
    ) {

      fish.health =
        clamp(
          fish.health - 1.1
        );

    }


    if (
      fish.cleanliness < 25
    ) {

      fish.health =
        clamp(
          fish.health - .8
        );

    }


    /*
      Healthy fish recover slightly.
    */

    if (
      fish.hunger > 70 &&
      fish.cleanliness > 55
    ) {

      fish.health =
        clamp(
          fish.health + .25
        );

    }


    /*
      Sad fish loses affection.
    */

    if (
      fish.hunger < 35 ||
      fish.health < 35
    ) {

      fish.affection =
        clamp(
          fish.affection - .3
        );

    }

  }

}


/* =========================================
   MOOD
========================================= */

function mood() {

  const average =

    (
      state.health +
      state.hunger +
      state.affection +
      state.energy
    ) / 4;


  if (
    state.health < 25
  ) {

    return [
      "☹",
      "Unwell",
      "I don't feel very good…"
    ];

  }


  if (
    state.hunger < 20
  ) {

    return [
      "○",
      "Very hungry",
      "My tummy is rumbling!"
    ];

  }


  if (
    state.cleanliness < 25
  ) {

    return [
      "~",
      "Grumpy",
      "Could we tidy the tank?"
    ];

  }


  if (
    average >= 78
  ) {

    return [
      "♥",
      "Delighted",
      "Everything is wonderful!"
    ];

  }


  if (
    average >= 58
  ) {

    return [
      "♡",
      "Happy",
      "Ready for a little adventure?"
    ];

  }


  if (
    average >= 40
  ) {

    return [
      "•",
      "Okay",
      "A little care would be lovely."
    ];

  }


  return [
    "…",
    "Lonely",
    "Can we spend some time together?"
  ];

}


/* =========================================
   RENDER EVERYTHING
========================================= */

function render() {

  /*
    Name
  */

  $("fishName").textContent =
    state.name;


  /*
    Day
  */

  $("day").textContent =
    state.day;


  /*
    Time
  */

  const hours =
    Math.floor(
      state.minutes / 60
    );


  const mins =
    state.minutes % 60;


  $("timeLabel").textContent =

    `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;


  /*
    Stat bars
  */

  const stats = [
    "health",
    "hunger",
    "affection",
    "energy"
  ];


  for (
    const key of stats
  ) {

    $(key + "Value").textContent =
      Math.round(state[key]);


    $(key + "Bar").style.width =
      state[key] + "%";

  }


  /*
    Mood
  */

  const [
    icon,
    moodName,
    status
  ] = mood();


  $("moodIcon").textContent =
    icon;


  $("moodText").textContent =
    moodName;


  $("statusText").textContent =
    status;


  /*
    Move fish depending
    on its mood/statistics.
  */

  updateFishPosition();

}


/* =========================================
   FISH MOVEMENT
========================================= */

function updateFishPosition() {

  /*
    More affection = fish swims
    slightly further across the tank.
  */

  const x =
    30 +
    (state.affection / 100) * 40;


  /*
    Lower energy makes the fish
    sit lower.
  */

  const y =
    39 +
    (
      (100 - state.energy)
      / 100
    ) * 15;


  $("fishWrap").style.left =
    x + "%";


  $("fishWrap").style.top =
    y + "%";

}


/* =========================================
   FISH SPEECH
========================================= */

function speak(text) {

  $("speech").textContent =
    text;

}


/* =========================================
   TOAST MESSAGE
========================================= */

function toast(text) {

  const element =
    $("toast");


  element.textContent =
    text;


  element.classList.add(
    "show"
  );


  clearTimeout(
    toast.timer
  );


  toast.timer =
    setTimeout(
      () => {

        element.classList.remove(
          "show"
        );

      },
      1800
    );

}


/* =========================================
   ANIMATIONS
========================================= */

function animate(kind) {

  const tank =
    $("tank");


  tank.classList.remove(
    "pop-heart",
    "pop-food"
  );


  /*
    Force browser to restart
    animation.
  */

  void tank.offsetWidth;


  tank.classList.add(
    kind
  );


  setTimeout(
    () => {

      tank.classList.remove(
        kind
      );

    },
    1000
  );

}


/* =========================================
   CARE ACTIONS
========================================= */

function doAction(type) {

  /*
    Prevent button spam.
  */

  if (actionLock) {
    return;
  }


  actionLock = true;


  /* =====================================
     FEED
  ===================================== */

  if (
    type === "feed"
  ) {

    if (
      state.hunger >= 95
    ) {

      speak(
        "I'm full! Maybe later? ♡"
      );


      toast(
        "Bubbles is already full."
      );

    }

    else {

      state.hunger =
        clamp(
          state.hunger + 24
        );


      state.health =
        clamp(
          state.health + 3
        );


      state.energy =
        clamp(
          state.energy + 2
        );


      state.affection =
        clamp(
          state.affection + 2
        );


      const messages = [

        "Yum yum! ☆",

        "Best snack ever!",

        "Nom nom nom!"

      ];


      speak(
        messages[
          Math.floor(
            Math.random()
            * messages.length
          )
        ]
      );


      animate(
        "pop-food"
      );


      toast(
        "+HUNGER  +HEALTH  +AFFECTION"
      );

    }

  }


  /* =====================================
     PLAY
  ===================================== */

  if (
    type === "play"
  ) {

    if (
      state.energy < 18
    ) {

      speak(
        "I'm sleepy… let's rest first."
      );


      toast(
        "Bubbles needs more energy."
      );

    }

    else {

      state.affection =
        clamp(
          state.affection + 10
        );


      state.energy =
        clamp(
          state.energy - 13
        );


      state.hunger =
        clamp(
          state.hunger - 5
        );


      const messages = [

        "Let's play! ★",

        "Wheee!",

        "That was fun! ♡"

      ];


      speak(
        messages[
          Math.floor(
            Math.random()
            * messages.length
          )
        ]
      );


      animate(
        "pop-heart"
      );


      toast(
        "+AFFECTION  -ENERGY"
      );

    }

  }


  /* =====================================
     CLEAN
  ===================================== */

  if (
    type === "clean"
  ) {

    state.cleanliness =
      clamp(
        state.cleanliness + 35
      );


    state.health =
      clamp(
        state.health + 7
      );


    state.affection =
      clamp(
        state.affection + 3
      );


    speak(
      "Sparkly! I can see my fins again ✧"
    );


    animate(
      "pop-heart"
    );


    toast(
      "Tank cleaned! +HEALTH"
    );

  }


  /* =====================================
     PET
  ===================================== */

  if (
    type === "pet"
  ) {

    state.affection =
      clamp(
        state.affection + 7
      );


    state.energy =
      clamp(
        state.energy + 2
      );


    const messages = [

      "Heehee… that tickles!",

      "♡♡♡",

      "You are my favourite human!"

    ];


    speak(
      messages[
        Math.floor(
          Math.random()
          * messages.length
        )
      ]
    );


    animate(
      "pop-heart"
    );


    toast(
      "+AFFECTION"
    );

  }


  /*
    Save and update screen.
  */

  save();

  render();


  setTimeout(
    () => {

      actionLock = false;

    },
    350
  );

}


/* =========================================
   NAME MODAL
========================================= */

function openNameModal() {

  $("nameInput").value =
    state.name;


  $("nameModal")
    .classList
    .remove("hidden");


  setTimeout(
    () => {

      $("nameInput").focus();

      $("nameInput").select();

    },
    30
  );

}


function closeNameModal() {

  $("nameModal")
    .classList
    .add("hidden");

}


/* =========================================
   BUTTON EVENTS
========================================= */

$("feedBtn")
  .addEventListener(
    "click",
    () => doAction("feed")
  );


$("playBtn")
  .addEventListener(
    "click",
    () => doAction("play")
  );


$("cleanBtn")
  .addEventListener(
    "click",
    () => doAction("clean")
  );


$("petBtn")
  .addEventListener(
    "click",
    () => doAction("pet")
  );


$("renameBtn")
  .addEventListener(
    "click",
    openNameModal
  );


$("cancelName")
  .addEventListener(
    "click",
    closeNameModal
  );


/* =========================================
   SAVE NEW NAME
========================================= */

$("saveName")
  .addEventListener(
    "click",
    () => {

      const value =
        $("nameInput")
          .value
          .trim()
          .replace(
            /\s+/g,
            " "
          );


      if (!value) {
        return;
      }


      state.name =
        value.slice(
          0,
          14
        );


      save();

      render();

      closeNameModal();


      speak(
        `Nice to meet you, ${state.name}! ♡`
      );

    }
  );


/* =========================================
   KEYBOARD SUPPORT
========================================= */

$("nameInput")
  .addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Enter"
      ) {

        $("saveName").click();

      }


      if (
        event.key === "Escape"
      ) {

        closeNameModal();

      }

    }
  );


/* =========================================
   RESET GAME
========================================= */

$("resetBtn")
  .addEventListener(
    "click",
    () => {

      const confirmed =
        confirm(
          "Reset your fish and start a new aquarium?"
        );


      if (!confirmed) {
        return;
      }


      state = {
        ...defaultState
      };


      save();

      render();


      speak(
        "A fresh new adventure! ♡"
      );


      toast(
        "Save reset."
      );

    }
  );


/* =========================================
   AUTOMATIC TIME
========================================= */

/*
  Every real-world minute,
  the fish experiences 10 in-game
  minutes.
*/

setInterval(
  () => {

    simulateTime(
      state,
      10
    );


    save();

    render();

  },
  60000
);


/* =========================================
   RANDOM IDLE SPEECH
========================================= */

setInterval(
  () => {

    const lines = [

      "The water feels nice today. ♡",

      "Have you seen my favourite plant?",

      "Bloop bloop!",

      "I wonder what is outside the tank…",

      "I love my little aquarium."

    ];


    if (
      Math.random() < .35
    ) {

      speak(
        lines[
          Math.floor(
            Math.random()
            * lines.length
          )
        ]
      );

    }

  },
  15000
);


/* =========================================
   START GAME
========================================= */

render();
```
