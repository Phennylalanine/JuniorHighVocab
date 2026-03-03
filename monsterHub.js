/**
 * monsterHub.js
 * Handles the "Total Level" logic and monster evolution system
 * (with branch locking: plant / shadow).
 */

function initMonsterHub() {
  const container = document.getElementById("overallLevel");
  const IMG_BASE = "./monster_image/";

  /* -----------------------------
     QUIZ CONFIG
  ----------------------------- */

  const QUIZ_DATA = [
    "verbPractice_level",
    "verbPractice2_level",
    "verbPractice3_level",
    "verbPractice4_level",
    "verbPractice5_level",
    "verbTest_level",
  ].map((key) => ({
    key,
    multiplier: key.includes("_") ? 0.5 : 0.3,
  }));

  /* -----------------------------
     LOCAL STORAGE HELPERS
  ----------------------------- */

  const LS = {
    get: (k) => localStorage.getItem(k),
    set: (k, v) => localStorage.setItem(k, v),
  };

  /* -----------------------------
     GET QUIZ LEVELS
  ----------------------------- */

  const storedLevels = Object.fromEntries(
    QUIZ_DATA.map(({ key }) => [key, parseInt(LS.get(key)) || 0])
  );

  const overallLevel = Math.floor(
    QUIZ_DATA.reduce(
      (sum, { key, multiplier }) => sum + storedLevels[key] * multiplier,
      0
    )
  );

  /* -----------------------------
     UI HELPERS
  ----------------------------- */

  const makeImg = (src) => {
    const i = document.createElement("img");
    i.src = src;
    i.style.maxWidth = "200px";
    i.style.display = "block";
    i.style.margin = "0 auto 12px";
    return i;
  };

  const makeLabel = (t) => {
    const d = document.createElement("div");
    d.style.fontWeight = "600";
    d.textContent = t;
    return d;
  };

  /* -----------------------------
     CORE RENDER
  ----------------------------- */

  function render() {
    container.innerHTML = "";

    let file = LS.get("selectedMonster");
    let stage = parseInt(LS.get("monsterStage")) || 0;
    let branch = LS.get("monsterBranch"); // "plant" | "shadow" | null

    // Determine stage from level
    let newStage = 0;

    if (overallLevel >= 20) newStage = 3;
    else if (overallLevel >= 10) newStage = 2;
    else if (overallLevel >= 5) newStage = 1;

    // Enforce step-by-step evolution
    if (newStage > stage) {
      showEvolutionChoices(stage + 1, branch);
      return;
    }

    // Default fallback images
    if (!file) {
      if (stage === 0) file = "shadowPlantEgg.png";
      if (stage === 1) file = "plantSlime_1.png";
      if (stage === 2) file = "plantEvo_2A.png";
      if (stage === 3) file = "plantEvo3A.png";
    }

    container.append(makeImg(`${IMG_BASE}${file}`));
    container.append(makeLabel(`レベル：${overallLevel}`));
  }

  /* -----------------------------
     SAVE EVOLUTION
  ----------------------------- */

  function saveEvolution(file, stage) {
    // Detect branch from filename
    let branch = "plant";

    if (file.startsWith("shadow")) {
      branch = "shadow";
    }

    // Lock branch if first time
    if (!LS.get("monsterBranch")) {
      LS.set("monsterBranch", branch);
    }

    LS.set("selectedMonster", file);
    LS.set("monsterStage", stage);

    render();
  }

  /* -----------------------------
     EVOLUTION MENU
  ----------------------------- */

  function showEvolutionChoices(stage, lockedBranch) {
    container.innerHTML = "";

    const title = document.createElement("div");
    title.textContent = "進化を選んでください";
    title.style.fontWeight = "600";
    title.style.marginBottom = "12px";

    container.append(title);

    let options = [];

    /* ---------- Stage 1 (Lv 5) ---------- */

    if (stage === 1) {
      options = [
        "plantSlime_1.png",
        "shadowSlime_1.png",
      ];
    }

    /* ---------- Stage 2 (Lv 10) ---------- */

    if (stage === 2) {
      if (lockedBranch === "shadow") {
        options = [
          "shadowEvo_2A.png",
          "shadowEvo_2B.png",
        ];
      } else {
        options = [
          "plantEvo_2A.png",
          "plantEvo_2B.png",
        ];
      }
    }

    /* ---------- Stage 3 (Lv 20) ---------- */

    if (stage === 3) {
      if (lockedBranch === "shadow") {
        options = [
          "shadowEvo3A.png",
          "shadowEvo3B.png",
          "shadowEvo3C.png",
          "shadowEvo3D.png",
        ];
      } else {
        options = [
          "plantEvo3A.png",
          "plantEvo3B.png",
          "plantEvo3C.png",
          "plantEvo3D.png",
        ];
      }
    }

    /* ---------- Render Buttons ---------- */

    options.forEach((file) => {
      const btn = document.createElement("button");

      btn.style.margin = "6px";
      btn.style.border = "none";
      btn.style.background = "none";
      btn.style.cursor = "pointer";

      const img = makeImg(`${IMG_BASE}${file}`);
      img.style.maxWidth = "100px";

      btn.append(img);

      btn.onclick = () => {
        saveEvolution(file, stage);
      };

      container.append(btn);
    });
  }

  /* -----------------------------
     INIT
  ----------------------------- */

  render();
}
