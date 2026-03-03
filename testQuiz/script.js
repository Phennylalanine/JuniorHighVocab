/* =========================
   Configuration & State
   ========================= */
const QUIZ_ID = "verbTest; 
const DATA_FILE = "./questions.json"; 
const MASTER_LIMIT = 3; // 1 level to Teach + 2 levels to Test

let globalProfile = { level: 1, xp: 0, totalCorrect: 0 };
let sessionStats = { created: Date.now(), words: {} };
let questions = [];
let currentQuestion = null;
let score = 0;
let combo = 0;

/* DOM ELEMENTS */
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
const inProgressList = document.getElementById("inProgressList");
const masteredList = document.getElementById("masteredList");

function speak(text) {
  window.speechSynthesis.cancel();
  const msg = new SpeechSynthesisUtterance(text);
  msg.lang = 'en-US';
  msg.rate = 0.9;
  window.speechSynthesis.speak(msg);
}

/* =========================
   Initialization
   ========================= */
async function init() {
  const savedProfile = localStorage.getItem(QUIZ_ID + "_profile");
  if (savedProfile) globalProfile = JSON.parse(savedProfile);
  
  const savedSession = localStorage.getItem("quiz_session_" + QUIZ_ID);
  if (savedSession) {
    const data = JSON.parse(savedSession);
    if ((Date.now() - data.created) < 172800000) sessionStats = data;
  }

  try {
    const res = await fetch(DATA_FILE);
    const data = await res.json();
    questions = data.questions;
  } catch (e) {
    console.error("Data load error", e);
  }

  updateStats();
  updatePanel();
  
  if (!localStorage.getItem(QUIZ_ID + "_level")) {
      localStorage.setItem(QUIZ_ID + "_level", globalProfile.level);
  }
}

/* =========================
   Game Loop
   ========================= */
function loadNext() {
  const pool = questions.filter(q => {
    const k = q.en + "|" + q.jp;
    return (sessionStats.words[k]?.correct || 0) < MASTER_LIMIT;
  });

  if (pool.length === 0) {
    alert("Incredible! You have mastered this level!");
    location.reload();
    return;
  }

  currentQuestion = pool[Math.floor(Math.random() * pool.length)];
  const key = currentQuestion.en + "|" + currentQuestion.jp;
  const currentMastery = sessionStats.words[key]?.correct || 0;

  // TEACHING vs QUIZ Logic
  if (currentMastery === 0) {
    jpText.textContent = currentQuestion.jp;
    enText.textContent = currentQuestion.en; // SHOW answer
    enText.style.opacity = "1";
    feedback.innerHTML = `<span style="color: #6366f1;">First time! Type the word to learn it.</span>`;
  } else {
    jpText.textContent = currentQuestion.jp;
    enText.textContent = "????"; // HIDE answer
    enText.style.opacity = "0.3";
    feedback.textContent = "";
  }
  
  speak(currentQuestion.en);

  input.value = "";
  input.disabled = false;
  input.classList.remove("success-input", "shake-input");
  input.focus();
  nextBtn.classList.add("hidden");
  tryAgainBtn.classList.add("hidden");
}

function checkAnswer() {
  const user = input.value.trim().toLowerCase();
  const correct = currentQuestion.en.toLowerCase();
  if (!user || input.disabled) return;

  if (user === correct) {
    feedback.innerHTML = "✔️ <strong>Correct!</strong>";
    feedback.className = "correct-style";
    input.classList.add("success-input");
    input.disabled = true;

    score++; combo++;
    updateProgress(currentQuestion, true);
    
    setTimeout(() => { loadNext(); }, 800); 
  } else {
    input.classList.add("shake-input");
    setTimeout(() => input.classList.remove("shake-input"), 400);
    
    // Character comparison logic
    let comparison = "";
    const maxLength = Math.max(user.length, correct.length);
    for (let i = 0; i < maxLength; i++) {
        const uChar = user[i] || "";
        const cChar = correct[i] || "";
        if (uChar === cChar) comparison += `<span style="color: #10b981;">${cChar}</span>`;
        else if (uChar && cChar) comparison += `<span style="color: #ef4444;">${uChar}</span>`;
        else if (!uChar) comparison += `<span style="color: #94a3b8;">_</span>`;
    }

    feedback.innerHTML = `✖️ <strong>Wrong!</strong><br>You: <code>${comparison}</code><br>Target: <span style="color: #10b981;">${correct}</span>`;
    combo = 0;
    updateProgress(currentQuestion, false);
    
    tryAgainBtn.classList.remove("hidden");
    tryAgainBtn.focus();
  }
}

/* =========================
   Data & Stats Management
   ========================= */
function updateProgress(q, isCorrect) {
  const key = q.en + "|" + q.jp;
  if (!sessionStats.words[key]) sessionStats.words[key] = { en: q.en, jp: q.jp, correct: 0 };
  
  if (isCorrect) {
    sessionStats.words[key].correct++;
    globalProfile.xp++;
    const needed = 10 + globalProfile.level * 3;
    if (globalProfile.xp >= needed) {
      globalProfile.xp = 0;
      globalProfile.level++;
      localStorage.setItem(QUIZ_ID + "_level", globalProfile.level);
    }
  } else {
    // RESET TO TEACHING MODE (0) on error
    sessionStats.words[key].correct = 0;
  }
  
  localStorage.setItem(QUIZ_ID + "_profile", JSON.stringify(globalProfile));
  localStorage.setItem("quiz_session_" + QUIZ_ID, JSON.stringify(sessionStats));
  updateStats();
  updatePanel();
}

function updateStats() {
  if (pointsEl) pointsEl.textContent = score;
  if (comboEl) comboEl.textContent = combo;
  if (levelEl) levelEl.textContent = globalProfile.level;
  const needed = 10 + globalProfile.level * 3;
  if (xpText) xpText.textContent = `${globalProfile.xp} / ${needed}`;
  if (xpBar) xpBar.style.width = (globalProfile.xp / needed) * 100 + "%";
}

function updatePanel() {
  if (!inProgressList || !masteredList) return;
  inProgressList.innerHTML = "";
  masteredList.innerHTML = "";

  Object.values(sessionStats.words)
    .sort((a,b) => b.correct - a.correct)
    .forEach(w => {
      const row = document.createElement("div");
      row.className = "session-row";
      row.textContent = `${w.en}: ${w.correct}/${MASTER_LIMIT}`;
      
      if (w.correct >= MASTER_LIMIT) {
        row.classList.add("score-mastered");
        masteredList.appendChild(row);
      } else {
        if (w.correct === 0) row.classList.add("score-0");
        else if (w.correct === 1) row.classList.add("score-1");
        else if (w.correct === 2) row.classList.add("score-2");
        inProgressList.appendChild(row);
      }
    });
}

/* =========================
   Event Listeners
   ========================= */
startBtn.addEventListener("click", () => {
  document.getElementById("startScreen").classList.add("hidden");
  document.getElementById("quizScreen").classList.remove("hidden");
  document.getElementById("quizScreen").classList.add("active");
  loadNext();
});

nextBtn.addEventListener("click", loadNext);

tryAgainBtn.addEventListener("click", () => {
  input.value = "";
  input.classList.remove("shake-input");
  input.focus();
  feedback.textContent = "";
  tryAgainBtn.classList.add("hidden");
});

input.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    checkAnswer();
  }
});

// Run
init();
