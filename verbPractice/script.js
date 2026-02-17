/* =========================
   CONFIG
========================= */

const DATA_FILE = "questions.json";
const RESET_DAYS = 2;
const MAX_PER_QUESTION = 3;


/* =========================
   ELEMENTS
========================= */

const startScreen = document.getElementById("startScreen");
const quizScreen = document.getElementById("quizScreen");

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

/* LEFT PANEL */
const sessionList = document.getElementById("sessionList");


/* =========================
   GAME STATE
========================= */

let questions = [];
let currentQuestion = null;

let score = 0;
let combo = 0;
let xp = 0;
let level = 1;


/* =========================
   SESSION TRACKING
========================= */

let sessionStats = {
  created: Date.now(),
  words: {},
  progress: {} // correct count per question
};


/* =========================
   STORAGE
========================= */

function loadSession() {

  const saved = localStorage.getItem("verbSession");

  if (!saved) return;

  const data = JSON.parse(saved);

  const age = Date.now() - data.created;
  const maxAge = RESET_DAYS * 24 * 60 * 60 * 1000;

  if (age > maxAge) {

    localStorage.removeItem("verbSession");

    sessionStats = {
      created: Date.now(),
      words: {},
      progress: {}
    };

    return;
  }

  sessionStats = data;
}


function saveSession() {

  localStorage.setItem(
    "verbSession",
    JSON.stringify(sessionStats)
  );
}


/* =========================
   HELPERS
========================= */

function getQuestionKey(q) {
  return q.en + "|" + q.jp;
}


/* =========================
   LOAD JSON
========================= */

async function loadQuestions() {

  const res = await fetch(DATA_FILE);
  const data = await res.json();

  questions = data.questions;

  startBtn.disabled = false;
}


/* =========================
   UI
========================= */

function showQuiz() {

  startScreen.classList.add("hidden");
  quizScreen.classList.remove("hidden");

  loadNext();
}


function updateStats() {

  pointsEl.textContent = score;
  comboEl.textContent = combo;

  levelEl.textContent = level;

  const need = level * 10;

  xpText.textContent = `${xp} / ${need} XP`;

  const percent = Math.min((xp / need) * 100, 100);

  xpBar.style.width = percent + "%";
}


/* =========================
   QUESTION LOGIC
========================= */

function getRandomQuestion() {

  const available = questions.filter(q => {

    const key = getQuestionKey(q);

    const count = sessionStats.progress[key] || 0;

    return count < MAX_PER_QUESTION;
  });

  if (available.length === 0) {
    endSession();
    return null;
  }

  const index = Math.floor(Math.random() * available.length);

  return available[index];
}


function loadNext() {

  const q = getRandomQuestion();

  if (!q) return;

  currentQuestion = q;

  jpText.textContent = q.jp;
  enText.textContent = q.en;

  input.value = "";
  input.disabled = false;

  feedback.textContent = "";

  nextBtn.disabled = true;
  tryAgainBtn.style.display = "none";

  input.focus();
}


function endSession() {

  quizScreen.classList.add("hidden");
  startScreen.classList.remove("hidden");

  alert("All questions completed for today.");
}


/* =========================
   WORD TRACKING
========================= */

function registerWord(q) {

  const key = getQuestionKey(q);

  if (!sessionStats.words[key]) {

    sessionStats.words[key] = {
      en: q.en,
      count: 0
    };
  }
}


function countAnswer(q) {

  const key = getQuestionKey(q);

  if (!sessionStats.words[key]) {
    registerWord(q);
  }

  sessionStats.words[key].count++;

  saveSession();

  updatePanel();
}


/* =========================
   SIDE PANEL
========================= */

function updatePanel() {

  if (!sessionList) return;

  sessionList.innerHTML = "";

  const list = Object.values(sessionStats.words);

  list.sort((a, b) => b.count - a.count);

  for (const w of list) {

    const row = document.createElement("div");

    row.textContent =
      `${w.jp} / ${w.en} : ${w.count}`;

    sessionList.appendChild(row);
  }
}


/* =========================
   ANSWER CHECK
========================= */

function checkAnswer() {

  const user = input.value.trim().toLowerCase();
  const correct = currentQuestion.en.toLowerCase();

  if (!user) return;

  const key = getQuestionKey(currentQuestion);

  if (!sessionStats.progress[key]) {
    sessionStats.progress[key] = 0;
  }


  /* CORRECT */
  if (user === correct) {

    feedback.textContent = "✓ Correct";
    feedback.style.color = "green";

    score++;
    combo++;

    xp++;

    /* Increase progress */
    sessionStats.progress[key]++;

    if (sessionStats.progress[key] > MAX_PER_QUESTION) {
      sessionStats.progress[key] = MAX_PER_QUESTION;
    }

    /* Only count AFTER answering */
    countAnswer(currentQuestion);

    if (xp >= level * 10) {
      xp = 0;
      level++;
    }

    input.disabled = true;
    nextBtn.disabled = false;
  }


  /* WRONG */
  else {

    feedback.textContent =
      `✗ Correct: ${currentQuestion.en}`;

    feedback.style.color = "red";

    combo = 0;

    /* Decrease progress */
    sessionStats.progress[key]--;

    if (sessionStats.progress[key] < 0) {
      sessionStats.progress[key] = 0;
    }

    tryAgainBtn.style.display = "inline-block";
  }


  saveSession();
  updateStats();
}


/* =========================
   EVENTS
========================= */

startBtn.addEventListener("click", showQuiz);


input.addEventListener("keydown", e => {

  if (e.key === "Enter") {
    checkAnswer();
  }
});


nextBtn.addEventListener("click", loadNext);


tryAgainBtn.addEventListener("click", () => {

  input.value = "";
  input.focus();

  feedback.textContent = "";

  tryAgainBtn.style.display = "none";
});


/* =========================
   INIT
========================= */

function init() {

  startBtn.disabled = true;

  loadSession();

  loadQuestions();

  updatePanel();
  updateStats();
}

init();
