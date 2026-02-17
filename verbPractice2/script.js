/* =====================
   QUIZ ID & CONFIG
===================== */
const QUIZ_ID = "verbs_part2";
const DATA_FILE = "./questions.json"; 
const LOCAL_LEVEL_KEY = "verbPractice2_level";
const RESET_DAYS = 2;   
const MASTER_LIMIT = 3; 

/* =====================
   GLOBAL PROFILE (XP & Levels)
===================== */
const GLOBAL_PROFILE_KEY = "quiz_global_profile";
let globalProfile = { level: 1, xp: 0, totalCorrect: 0 };

function loadGlobalProfile() {
  const saved = localStorage.getItem(GLOBAL_PROFILE_KEY);
  if (saved) globalProfile = JSON.parse(saved);
}

function saveGlobalProfile() {
  localStorage.setItem(GLOBAL_PROFILE_KEY, JSON.stringify(globalProfile));
}

/* =====================
   SESSION STORAGE
===================== */
const SESSION_KEY = "quiz_session_" + QUIZ_ID;
let sessionStats = { created: Date.now(), words: {} };

function loadSession() {
  const saved = localStorage.getItem(SESSION_KEY);
  if (!saved) return;
  const data = JSON.parse(saved);
  if ((Date.now() - data.created) > RESET_DAYS * 86400000) return;
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

let questions = [];
let currentQuestion = null;
let score = 0;
let combo = 0;

/* =====================
   NEW: TEXT TO SPEECH (English)
===================== */
function speak(text) {
  // Cancel any ongoing speech so they don't overlap
  window.speechSynthesis.cancel();
  const msg = new SpeechSynthesisUtterance(text);
  msg.lang = 'en-US'; 
  msg.rate = 0.9; 
  window.speechSynthesis.speak(msg);
}

/* =====================
   GAME LOGIC
===================== */
async function loadQuestions() {
  try {
    const res = await fetch(DATA_FILE);
    const data = await res.json();
    questions = data.questions;
    startBtn.disabled = false;
  } catch (err) { console.error(err); }
}

function updateWord(q, isCorrect) {
  const key = q.en + "|" + q.jp;
  if (!sessionStats.words[key]) {
    sessionStats.words[key] = { en: q.en, jp: q.jp, correct: 0 };
  }
  if (isCorrect) {
    sessionStats.words[key].correct++;
    updateGlobalProgress();
  } else {
    sessionStats.words[key].correct = Math.max(0, sessionStats.words[key].correct - 1);
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
  localStorage.setItem(LOCAL_LEVEL_KEY, globalProfile.level);
}

function loadNext() {
  const pool = questions.filter(q => {
    const k = q.en + "|" + q.jp;
    return (sessionStats.words[k]?.correct || 0) < MASTER_LIMIT;
  });

  if (pool.length === 0) {
    alert("Mastered all items!");
    location.reload();
    return;
  }

  currentQuestion = pool[Math.floor(Math.random() * pool.length)];
  jpText.textContent = currentQuestion.jp;
  enText.textContent = currentQuestion.en;
  
  // TRIGGER SPEECH
  speak(currentQuestion.en);

  input.value = "";
  input.disabled = false;
  feedback.textContent = "";
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
    feedback.className = "correct-style";
    score++;
    combo++;
    updateWord(currentQuestion, true);
    input.disabled = true;
    nextBtn.disabled = false;
  } else {
    // TRIGGER SHAKE
    input.classList.add("shake-input");
    setTimeout(() => input.classList.remove("shake-input"), 400);

    feedback.textContent = `✗ Answer: ${currentQuestion.en}`;
    feedback.className = "wrong-style";
    combo = 0;
    updateWord(currentQuestion, false);
    tryAgainBtn.style.display = "inline-block";
  }
  updateStats();
}

/* =====================
   UI HELPERS & EVENTS
===================== */
function updateStats() {
  if (pointsEl) pointsEl.textContent = score;
  if (comboEl) comboEl.textContent = combo;
  if (levelEl) levelEl.textContent = globalProfile.level;
  const needed = 10 + globalProfile.level * 3;
  if (xpText) xpText.textContent = `${globalProfile.xp} / ${needed}`;
  if (xpBar) xpBar.style.width = (globalProfile.xp / needed) * 100 + "%";
}

function updatePanel() {
  if (!sessionList) return;
  sessionList.innerHTML = "";
  Object.values(sessionStats.words)
    .sort((a,b) => b.correct - a.correct)
    .forEach(w => {
      const row = document.createElement("div");
      row.className = "session-row";
      row.textContent = `${w.en}: ${w.correct}/${MASTER_LIMIT}`;
      sessionList.appendChild(row);
    });
}

function init() {
  loadGlobalProfile();
  loadSession();
  loadQuestions();
  updatePanel();
  updateStats();
  localStorage.setItem(LOCAL_LEVEL_KEY, globalProfile.level);
}

startBtn.addEventListener("click", () => {
  document.getElementById("startScreen").classList.add("hidden");
  document.getElementById("quizScreen").classList.remove("hidden");
  document.getElementById("quizScreen").classList.add("active");
  loadNext();
});

nextBtn.addEventListener("click", loadNext);
input.addEventListener("keydown", e => { if (e.key === "Enter") checkAnswer(); });
tryAgainBtn.addEventListener("click", () => {
  input.value = "";
  input.focus();
  feedback.textContent = "";
  tryAgainBtn.style.display = "none";
});

init();
