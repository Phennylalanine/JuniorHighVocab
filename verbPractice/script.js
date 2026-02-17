/* =====================
   QUIZ ID & CONFIG
===================== */
const QUIZ_ID = "verbs_part1";
const DATA_FILE = "./questions.json"; 
const RESET_DAYS = 2;   // How often to reset progress
const MASTER_LIMIT = 3; // How many correct answers to "master" a word

/* =====================
   GLOBAL PROFILE (XP & Levels)
===================== */
const GLOBAL_PROFILE_KEY = "quiz_global_profile";
let globalProfile = { level: 1, xp: 0, totalCorrect: 0 };

// Load user's global level/XP from storage
function loadGlobalProfile() {
  const saved = localStorage.getItem(GLOBAL_PROFILE_KEY);
  if (saved) globalProfile = JSON.parse(saved);
}

// Save user's global progress
function saveGlobalProfile() {
  localStorage.setItem(GLOBAL_PROFILE_KEY, JSON.stringify(globalProfile));
}

/* =====================
   SESSION STORAGE (Daily Progress)
===================== */
const SESSION_KEY = "quiz_session_" + QUIZ_ID;
let sessionStats = { created: Date.now(), words: {} };

// Load current quiz session (resets if too old)
function loadSession() {
  const saved = localStorage.getItem(SESSION_KEY);
  if (!saved) return;
  const data = JSON.parse(saved);
  const age = Date.now() - data.created;
  if (age > RESET_DAYS * 86400000) {
    localStorage.removeItem(SESSION_KEY);
    return;
  }
  sessionStats = data;
}

function saveSession() {
  localStorage.setItem(SESSION_KEY, JSON.stringify(sessionStats));
}

/* =====================
   DOM ELEMENTS
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
   GAME STATE & LOADING
===================== */
let questions = [];
let currentQuestion = null;
let score = 0;
let combo = 0;

// Fetch questions from JSON file
async function loadQuestions() {
  try {
    const res = await fetch(DATA_FILE);
    if (!res.ok) throw new Error("Failed to load questions.json");
    const data = await res.json();
    questions = data.questions;
    startBtn.disabled = false; // Enable button once data is ready
  } catch (err) {
    console.error("Load error:", err);
    startBtn.disabled = false; // Fallback to let user try anyway
  }
}

/* =====================
   QUIZ LOGIC (Transition & Next)
===================== */

// ✅ FIXED: This function now switches screens correctly
function startQuiz() {
  const startScreen = document.getElementById("startScreen");
  const quizScreen = document.getElementById("quizScreen");

  // Show quiz, hide start screen
  startScreen.classList.add("hidden");
  startScreen.classList.remove("active");
  quizScreen.classList.remove("hidden");
  quizScreen.classList.add("active");

  loadNext(); // Load the first question
}

// Selects a random question that isn't mastered yet
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

// Logic for checking user answer
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
    feedback.textContent = `✗ Correct: ${currentQuestion.en}`;
    combo = 0;
    updateWord(currentQuestion, false);
    tryAgainBtn.style.display = "inline-block";
  }
  updateStats();
}

/* =====================
   INITIALIZATION & EVENTS
===================== */
function init() {
  startBtn.disabled = true; // Wait for questions to load
  loadGlobalProfile();
  loadSession();
  loadQuestions();
  updateStats();
}

startBtn.addEventListener("click", startQuiz); // Now calls startQuiz instead of loadNext
nextBtn.addEventListener("click", loadNext);
input.addEventListener("keydown", e => { if (e.key === "Enter") checkAnswer(); });
tryAgainBtn.addEventListener("click", () => {
  input.value = "";
  input.focus();
  feedback.textContent = " ";
  tryAgainBtn.style.display = "none";
});

init();
