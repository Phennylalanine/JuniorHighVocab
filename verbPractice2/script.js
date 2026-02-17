/* =====================
   QUIZ ID
===================== */

const QUIZ_ID = "verbs_part2";


/* =====================
   CONFIG
===================== */

const DATA_FILE = "questions.json";
const RESET_DAYS = 2;
const MASTER_LIMIT = 3;


/* =====================
   GLOBAL PROFILE
===================== */

const GLOBAL_PROFILE_KEY = "quiz_global_profile";

let globalProfile = {
  level: 1,
  xp: 0,
  totalCorrect: 0
};

function loadGlobalProfile() {

  const saved = localStorage.getItem(GLOBAL_PROFILE_KEY);

  if (saved) {
    globalProfile = JSON.parse(saved);
  }
}

function saveGlobalProfile() {

  localStorage.setItem(
    GLOBAL_PROFILE_KEY,
    JSON.stringify(globalProfile)
  );
}


/* =====================
   SESSION STORAGE
===================== */

const SESSION_KEY = "quiz_session_" + QUIZ_ID;

let sessionStats = {
  created: Date.now(),
  words: {}
};


function loadSession() {

  const saved = localStorage.getItem(SESSION_KEY);

  if (!saved) return;

  const data = JSON.parse(saved);

  const age = Date.now() - data.created;
  const maxAge = RESET_DAYS * 86400000;

  if (age > maxAge) {
    localStorage.removeItem(SESSION_KEY);
    return;
  }

  sessionStats = data;
}


function saveSession() {

  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify(sessionStats)
  );
}


/* =====================
   ELEMENTS
===================== */

const startBtn = document.getElementById("startBtn");
const nextBtn = document.getElementById("nextBtn");
const tryAgainBtn = document.getElementById("tryAgainBtn");

const jpText = document.getElementById("jpText");
const enText = document.getElementById("enText");

const input = document.getElementById("answerInput");
const feedback = document.getElementById("feedback");

const pointsEl = document.getElementById("points");
const comboEl = document.getElementById("combo");

const levelEl = document.getElementById("level");
const xpBar = document.getElementById("xpBar");
const xpText = document.getElementById("xpText");

const sessionList = document.getElementById("sessionList");


/* =====================
   GAME STATE
===================== */

let questions = [];
let currentQuestion = null;

let score = 0;
let combo = 0;


/* =====================
   LOAD QUESTIONS
===================== */

async function loadQuestions() {

  const res = await fetch(DATA_FILE);
  const data = await res.json();

  questions = data.questions;

  startBtn.disabled = false;
}


/* =====================
   WORD TRACKING
===================== */

function updateWord(q, isCorrect) {

  const key = q.en + "|" + q.jp;

  if (!sessionStats.words[key]) {

    sessionStats.words[key] = {
      en: q.en,
      jp: q.jp,
      correct: 0
    };
  }

  if (isCorrect) {

    sessionStats.words[key].correct++;

    updateGlobalProgress();

  } else {

    sessionStats.words[key].correct =
      Math.max(0, sessionStats.words[key].correct - 1);
  }

  saveSession();
  updatePanel();
}


function updateGlobalProgress() {

  globalProfile.xp++;
  globalProfile.totalCorrect++;

  const needed = 10 + globalProfile.level * 3;

  if (globalProfile.xp >= needed) {

    globalProfile.xp = 0;
    globalProfile.level++;
  }

  saveGlobalProfile();
}


/* =====================
   QUESTION POOL
===================== */

function getAvailableQuestions() {

  return questions.filter(q => {

    const key = q.en + "|" + q.jp;
    const data = sessionStats.words[key];

    if (!data) return true;

    return data.correct < MASTER_LIMIT;
  });
}


function getRandomQuestion() {

  const pool = getAvailableQuestions();

  if (pool.length === 0) {
    finishQuiz();
    return null;
  }

  return pool[Math.floor(Math.random() * pool.length)];
}


/* =====================
   UI
===================== */

function updateStats() {

  pointsEl.textContent = score;
  comboEl.textContent = combo;

  levelEl.textContent = globalProfile.level;

  const needed = 10 + globalProfile.level * 3;

  xpText.textContent =
    `${globalProfile.xp} / ${needed}`;

  xpBar.style.width =
    (globalProfile.xp / needed) * 100 + "%";
}


function updatePanel() {

  if (!sessionList) return;

  sessionList.innerHTML = "";

  const list = Object.values(sessionStats.words);

  list.sort((a, b) => b.correct - a.correct);

  for (const w of list) {

    const row = document.createElement("div");

    row.textContent =
      `${w.jp} / ${w.en} : ${w.correct}`;

    sessionList.appendChild(row);
  }
}


/* =====================
   QUIZ FLOW
===================== */

function loadNext() {

  currentQuestion = getRandomQuestion();

  if (!currentQuestion) return;

  jpText.textContent = currentQuestion.jp;
  enText.textContent = currentQuestion.en;

  input.value = "";
  input.disabled = false;

  feedback.textContent = " ";
  nextBtn.disabled = true;

  tryAgainBtn.style.display = "none";

  input.focus();
}


function checkAnswer() {

  const user = input.value.trim().toLowerCase();
  const correct = currentQuestion.en.toLowerCase();

  if (!user) return;

  if (user === correct) {

    feedback.textContent = "✓ Correct";

    score++;
    combo++;

    updateWord(currentQuestion, true);

    input.disabled = true;
    nextBtn.disabled = false;

  } else {

    feedback.textContent =
      `✗ Correct: ${currentQuestion.en}`;

    combo = 0;

    updateWord(currentQuestion, false);

    tryAgainBtn.style.display = "inline-block";
  }

  updateStats();
}


function finishQuiz() {

  alert("All words completed for today!");

  localStorage.setItem(
    "quiz_cooldown_" + QUIZ_ID,
    Date.now()
  );

  location.reload();
}


/* =====================
   EVENTS
===================== */

startBtn.addEventListener("click", loadNext);

input.addEventListener("keydown", e => {

  if (e.key === "Enter") {
    checkAnswer();
  }
});

nextBtn.addEventListener("click", loadNext);

tryAgainBtn.addEventListener("click", () => {

  input.value = "";
  input.focus();

  feedback.textContent = " ";

  tryAgainBtn.style.display = "none";
});


/* =====================
   INIT
===================== */

function init() {

  startBtn.disabled = true;

  loadGlobalProfile();
  loadSession();

  loadQuestions();

  updatePanel();
  updateStats();
}

init();
