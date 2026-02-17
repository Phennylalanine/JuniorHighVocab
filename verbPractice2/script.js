const QUIZ_ID = "verbs_part2";
const DATA_FILE = "./questions.json"; 
const LOCAL_LEVEL_KEY = "verbPractice2_level";
const RESET_DAYS = 2;   
const MASTER_LIMIT = 3; 

let globalProfile = { level: 1, xp: 0, totalCorrect: 0 };
let sessionStats = { created: Date.now(), words: {} };
let questions = [];
let currentQuestion = null;
let score = 0;
let combo = 0;

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

function speak(text) {
  window.speechSynthesis.cancel();
  const msg = new SpeechSynthesisUtterance(text);
  msg.lang = 'en-US';
  msg.rate = 0.9;
  window.speechSynthesis.speak(msg);
}

async function init() {
  const savedProfile = localStorage.getItem("quiz_global_profile");
  if (savedProfile) globalProfile = JSON.parse(savedProfile);
  
  const savedSession = localStorage.getItem("quiz_session_" + QUIZ_ID);
  if (savedSession) {
    const data = JSON.parse(savedSession);
    if ((Date.now() - data.created) < RESET_DAYS * 86400000) sessionStats = data;
  }

  try {
    const res = await fetch(DATA_FILE);
    const data = await res.json();
    questions = data.questions;
  } catch (e) { console.error("Data load error", e); }

  updateStats();
  updatePanel();
}

function loadNext() {
  const pool = questions.filter(q => {
    const k = q.en + "|" + q.jp;
    return (sessionStats.words[k]?.correct || 0) < MASTER_LIMIT;
  });

  if (pool.length === 0) {
    alert("Perfect! All verbs mastered!");
    location.reload();
    return;
  }

  currentQuestion = pool[Math.floor(Math.random() * pool.length)];
  jpText.textContent = currentQuestion.jp;
  enText.textContent = currentQuestion.en;
  
  speak(currentQuestion.en); // Speaks English

  input.value = "";
  input.disabled = false;
  input.focus();
  feedback.textContent = "";
  
  nextBtn.classList.add("hidden");
  tryAgainBtn.classList.add("hidden");
}

function checkAnswer() {
  const user = input.value.trim().toLowerCase();
  const correct = currentQuestion.en.toLowerCase();
  if (!user) return;

  if (user === correct) {
    feedback.textContent = "✓ Correct!";
    feedback.className = "correct-style";
    score++; combo++;
    updateMastery(currentQuestion, true);
    input.disabled = true;
    
    // Show Next Button
    nextBtn.classList.remove("hidden");
    tryAgainBtn.classList.add("hidden");
  } else {
    input.classList.add("shake-input");
    setTimeout(() => input.classList.remove("shake-input"), 400);
    
    feedback.textContent = `✗ Answer: ${currentQuestion.en}`;
    feedback.className = "wrong-style";
    combo = 0;
    updateMastery(currentQuestion, false);
    
    // Show Try Again Button
    tryAgainBtn.classList.remove("hidden");
    nextBtn.classList.add("hidden");
  }
  updateStats();
}

function updateMastery(q, isCorrect) {
  const key = q.en + "|" + q.jp;
  if (!sessionStats.words[key]) sessionStats.words[key] = { en: q.en, jp: q.jp, correct: 0 };
  
  if (isCorrect) {
    sessionStats.words[key].correct++;
    globalProfile.xp++;
    const needed = 10 + globalProfile.level * 3;
    if (globalProfile.xp >= needed) {
      globalProfile.xp = 0;
      globalProfile.level++;
    }
  } else {
    sessionStats.words[key].correct = Math.max(0, sessionStats.words[key].correct - 1);
  }
  
  localStorage.setItem("quiz_global_profile", JSON.stringify(globalProfile));
  localStorage.setItem("quiz_session_" + QUIZ_ID, JSON.stringify(sessionStats));
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

startBtn.addEventListener("click", () => {
  document.getElementById("startScreen").classList.add("hidden");
  document.getElementById("quizScreen").classList.remove("hidden");
  document.getElementById("quizScreen").classList.add("active");
  loadNext();
});

nextBtn.addEventListener("click", loadNext);
tryAgainBtn.addEventListener("click", () => {
  input.value = "";
  input.focus();
  feedback.textContent = "";
  tryAgainBtn.classList.add("hidden");
});

input.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    if (!nextBtn.classList.contains("hidden")) loadNext();
    else if (!tryAgainBtn.classList.contains("hidden")) {
       input.value = ""; input.focus(); feedback.textContent = ""; tryAgainBtn.classList.add("hidden");
    } else checkAnswer();
  }
});

init();
