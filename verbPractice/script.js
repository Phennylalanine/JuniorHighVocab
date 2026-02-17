/* =========================
   CONFIG
========================= */

const DATA_FILE = "questions.json"; // your JSON file
const RESET_DAYS = 2;


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

const choicesText = document.getElementById("choicesText");


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
  words: {}
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

  const index = Math.floor(Math.random() * questions.length);

  return questions[index];
}


function loadNext() {

  currentQuestion = getRandomQuestion();

  jpText.textContent = currentQuestion.jp;
  enText.textContent = currentQuestion.en;

  input.value = "";
  input.disabled = false;

  feedback.textContent = "";

  nextBtn.disabled = true;
  tryAgainBtn.style.display = "none";

  input.focus();

  registerWord(currentQuestion);
}


/* =========================
   WORD TRACKING
========================= */

function registerWord(q) {

  const key = q.en + "|" + q.jp;

  if (!sessionStats.words[key]) {

    sessionStats.words[key] = {
      en: q.en,
      jp: q.jp,
      count: 0
    };
  }

  saveSession();

  updatePanel();
}


function countAnswer(q) {

  const key = q.en + "|" + q.jp;

  if (!sessionStats.words[key]) return;

  sessionStats.words[key].count++;

  saveSession();

  updatePanel();
}


/* =========================
   SIDE PANEL
========================= */

function updatePanel() {

  let html = "<strong>Session Words</strong><br><br>";

  const list = Object.values(sessionStats.words);

  list.sort((a, b) => b.count - a.count);

  for (const w of list) {

    html += `
      ${w.jp} / ${w.en}
      : ${w.count}<br>
    `;
  }

  choicesText.innerHTML = html;
}


/* =========================
   ANSWER CHECK
========================= */

function checkAnswer() {

  const user = input.value.trim().toLowerCase();
  const correct = currentQuestion.en.toLowerCase();

  if (!user) return;

  if (user === correct) {

    feedback.textContent = "✓ Correct";
    feedback.style.color = "green";

    score++;
    combo++;

    xp++;

    countAnswer(currentQuestion);

    if (xp >= level * 10) {
      xp = 0;
      level++;
    }

    input.disabled = true;
    nextBtn.disabled = false;
  }

  else {

    feedback.textContent =
      `✗ Correct: ${currentQuestion.en}`;

    feedback.style.color = "red";

    combo = 0;

    tryAgainBtn.style.display = "inline-block";
  }

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
