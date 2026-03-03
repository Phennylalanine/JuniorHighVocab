/**
 * monsterHub.js
 * Handles the "Total Level" logic and the visual representation 
 * of the user's progress (Monster evolution).
 */

function initMonsterHub() {
  const container = document.getElementById("overallLevel");
  const IMG_BASE = "./monster_image/";

  // Thresholds for monster evolution stages
  const LEVELS = { EGG: 5, SLIME: 10, EVO2: 20 };

  // Mapping of internal file identifiers to Japanese display names
  const IMAGE_NAMES = {
    shadowPlantEgg: "ヤミタマ",
    plantSlime_1: "ハナゴロ",
    shadowSlime_1: "カゲモチ",
    plantEvo_2A: "ネッコン",
    plantEvo_2B: "モリフワ",
    shadowEvo_2A: "スミボウ",
    shadowEvo_2B: "ヨルビト",
    shadowEvo3A: "シャドウロウ",
    shadowEvo3B: "グルムドン",
    shadowEvo3C: "ウィスパップ",
    shadowEvo3D: "シャドピク",
    plantEvo3A: "ハナリコ",
    plantEvo3B: "ツルケン",
    plantEvo3C: "カメキノ",
    plantEvo3D: "キカブン",
  };

  /**
   * Configuration for how different quizzes contribute to the Total Level.
   * "M" (Monster) quizzes have a higher weight (0.5) than "S" (Standard) quizzes (0.3).
   */
  const QUIZ_DATA = [
    "verbPractice_level", "verbPractice2_level", "verbPractice3_level", "verbPractice4_level", "verbPractice5_level","verbTest_level",
  ].map((key) => ({ 
    key, 
    multiplier: key.includes("_") ? 0.5 : 0.3 
  }));

  // Helper object for localStorage interactions
  const LS = {
    get: (k) => localStorage.getItem(k),
    set: (k, v) => localStorage.setItem(k, v),
  };

  // Create an object of current levels retrieved from storage
  const storedLevels = Object.fromEntries(
    QUIZ_DATA.map(({ key }) => [key, parseInt(LS.get(key)) || 0])
  );

  // Calculate the weighted total level, rounded down to the nearest integer
  const overallLevel = Math.floor(
    QUIZ_DATA.reduce(
      (sum, { key, multiplier }) => sum + storedLevels[key] * multiplier,
      0
    )
  );

  /**
   * Utility to generate an image element for the monster mascot
   * @param {string} src - The URL/path to the image
   */
  const makeImg = (src) => {
    const i = document.createElement("img");
    i.src = src;
    i.style.maxWidth = "200px";
    i.style.display = "block";
    i.style.margin = "0 auto 12px";
    return i;
  };

  /**
   * Utility to generate a label showing the level text
   * @param {string} t - The text to display
   */
  const makeLabel = (t) => {
    const d = document.createElement("div");
    d.style.fontWeight = "600";
    d.textContent = t;
    return d;
  };

  /**
   * Renders the calculated level and current monster image to the DOM
   */
 function render() {
    container.innerHTML = "";
    let file = localStorage.getItem("selectedMonster");

    // SCALEABLE EVOLUTION LOGIC
    if (overallLevel < 5) {
        file = "shadowPlantEgg.png";
    } else if (overallLevel < 15) {
        // Levels 5-14: Show Slime if they haven't evolved yet
        file = file || "plantSlime_1.png"; 
    } else if (overallLevel < 30) {
        // Levels 15-29: Show Stage 2 if they haven't picked one
        file = file || "plantEvo_2A.png";
    } else {
        // Level 30+: Show a final form if they haven't picked one
        file = file || "plantEvo3A.png";
    }

    container.append(makeImg(`${IMG_BASE}${file}`));
    container.append(makeLabel(`レベル：${Math.floor(overallLevel)}`));
}

  render();
}
