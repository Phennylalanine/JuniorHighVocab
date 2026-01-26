// monsterHub.js

function initMonsterHub() {
  const container = document.getElementById("overallLevel");
  const IMG_BASE = "./monster_image/";

  const LEVELS = { EGG: 5, SLIME: 10, EVO2: 20 };

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

  const QUIZ_DATA = [
    "buildingSlevelr",
    "eventSlevelr",
    "placeSlevelr",
    "oppositeSlevelr",
    "schoolEventSlevelr",
    "directionsLevelr",
    "buildingMlevelr",
    "eventMlevelr",
    "placesMlevelr",
    "oppositeMlevelr",
    "schoolEventMlevelr",
  ].map((key) => ({ key, multiplier: key.includes("M") ? 0.5 : 0.3 }));

  const LS = {
    get: (k) => localStorage.getItem(k),
    set: (k, v) => localStorage.setItem(k, v),
  };

  const storedLevels = Object.fromEntries(
    QUIZ_DATA.map(({ key }) => [key, parseInt(LS.get(key)) || 0])
  );

  const overallLevel = Math.floor(
    QUIZ_DATA.reduce(
      (sum, { key, multiplier }) => sum + storedLevels[key] * multiplier,
      0
    )
  );

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

  function render() {
    container.innerHTML = "";

    const file =
      overallLevel < LEVELS.EGG
        ? "shadowPlantEgg.png"
        : localStorage.getItem("selectedMonster");

    if (file) {
      container.append(makeImg(`${IMG_BASE}${file}`));
      container.append(makeLabel(`レベル：${overallLevel}`));
    }
  }

  render();
}
