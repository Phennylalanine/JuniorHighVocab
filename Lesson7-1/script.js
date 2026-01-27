// =========================
// Quiz State Variables
// =========================
let currentQuestion = null;
let score = 0;
let combo = 0;
let level = 1;
let xp = 0;
let questions = [];
let answered = false;

const maxComboForBonus = 5;

// =========================
// Metadata / Cooldown Settings
// =========================
let META_KEY = null;
const DEFAULT_META_KEY = "Lesson7Vocabulary1";
const ASK_THRESHOLD = 5;
const COOLDOWN_DAYS = 7;

window.addEventListener("DOMContentLoaded", () => {
  // =========================
  // DOM Elements
  // =========================
  const jpText = document.getElementById("jpText");
  const enText = document.getElementById("enText");
  const answerInput = document.getElementById("answerInput");
  const feedback = document.getElementById("feedback");
  const nextBtn = document.getElementById("nextBtn");
  const tryAgainBtn = document.getElementById("tryAgainBtn");

  const pointsEl = document.getElementById("points");
  const comboEl = document.getElementById("combo");
  const levelEl = document.getElementById("level");
  const xpBar = document.getElementById("xpBar");
  const xpText = document.getElementById("xpText");

  const startBtn = document.getElementById("startBtn");

  // =========================
  // Confetti
  // =========================
  const confettiCanvas = document.getElementById("confettiCanvas");
  const ctx = confettiCanvas.getContext("2d");
  let confettiParticles = [];

  // =========================
  // Event Listeners
  // =========================
  startBtn.addEventListener("click", startQuiz);

  nextBtn.addEventListener("click", () => {
    if (answered) loadNextQuestion();
  });

  answerInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      if (!answered) checkAnswer();
      else if (!nextBtn.disabled) nextBtn.click();
    }
  });

  tryAgainBtn.addEventListener("click", tryAgain);

  loadProgress();

  // =========================
  // Load Questions
  // =========================
  fetch("questions.json")
    .then(res => res.json())
    .then(data => {
      const list = Array.isArray(data) ? data : data.questions;
      questions = normalizeQuestions(list);
      META_KEY = "meta_lesson7_v1";
      shuffleArray(questions);
    })
    .catch(err => {
      console.error("Failed to load questions:", err);
    });

  // =========================
  // START QUIZ (✅ FIXED)
  // =========================
  function startQuiz() {
    if (!questions || questions.length === 0) {
      alert("Questions are still loading.");
      return;
    }

    // ✅ FIX: swap visibility correctly
    const startScreen = document.getElementById("startScreen");
    const quizScreen = document.getElementById("quizScreen");

    startScreen.classList.add("hidden");
    startScreen.classList.remove("active");

    quizScreen.classList.remove("hidden");
    quizScreen.classList.add("active");

    // Reset state
    score = 0;
    combo = 0;
    answered = false;

    updateStats();
    loadNextQuestion();
  }

  // =========================
  // Question Helpers
  // =========================
  function normalizeQuestions(arr) {
    return arr.map((q, i) => ({
      id: q.id ?? i + 1,
      jp: q.jp,
      en: q.en
    }));
  }

  function loadNextQuestion() {
    currentQuestion = questions[Math.floor(Math.random() * questions.length)];

    jpText.textContent = currentQuestion.jp;
    enText.textContent = currentQuestion.en;
    answerInput.value = "";
    answerInput.disabled = false;
    answerInput.focus();

    feedback.textContent = "";
    nextBtn.disabled = true;
    tryAgainBtn.style.display = "none";
    answered = false;

    speak(currentQuestion.en);
  }

  // =========================
  // Answer Logic
  // =========================
  function checkAnswer() {
    if (answered) return;
    answered = true;

    const user = answerInput.value.trim();
    const correct = currentQuestion.en;

    if (user === correct) {
      feedback.innerHTML = "✔️ Correct!";
      feedback.style.color = "green";
      score++;
      combo++;
      gainXP(1);
      nextBtn.disabled = false;
    } else {
      feedback.innerHTML = `✖️ Wrong<br>Correct: <strong>${correct}</strong>`;
      feedback.style.color = "red";
      combo = 0;
      tryAgainBtn.style.display = "inline-block";
    }

    answerInput.disabled = true;
    updateStats();
  }

  function tryAgain() {
    feedback.textContent = "";
    answerInput.disabled = false;
    answerInput.value = "";
    answerInput.focus();
    tryAgainBtn.style.display = "none";
    answered = false;
  }

  // =========================
  // XP / Level
  // =========================
  function gainXP(amount) {
    xp += amount;
    if (xp >= xpToNextLevel(level)) {
      xp = 0;
      level++;
      triggerConfetti();
    }
    saveProgress();
    updateStats();
  }

  function xpToNextLevel(lv) {
    return 3 + lv * 2;
  }

  function updateStats() {
    pointsEl.textContent = score;
    comboEl.textContent = combo;
    levelEl.textContent = level;

    const needed = xpToNextLevel(level);
    xpBar.style.width = `${(xp / needed) * 100}%`;
    xpText.textContent = `${xp} / ${needed}`;
  }

  function saveProgress() {
    localStorage.setItem("lesson7_xp", xp);
    localStorage.setItem("lesson7-1sLevelr", level);
   }

  function loadProgress() {
    xp = Number(localStorage.getItem("lesson7_xp")) || 0;
    level = Number(localStorage.getItem("lesson7-1sLevelr")) || 1;
    updateStats();
  }

  // =========================
  // Utilities
  // =========================
  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  function speak(text) {
    if (!text) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-UK";
    speechSynthesis.speak(u);
  }

 // =========================
// Confetti
// =========================
function triggerConfetti() {
  // ✅ Clear old confetti first
  confettiParticles = [];

  for (let i = 0; i < 80; i++) {
    confettiParticles.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * -20,
      r: Math.random() * 5 + 2,
      d: Math.random() * 4 + 1,
      color: `hsl(${Math.random() * 360},100%,70%)`
    });
  }

  // ✅ Stop confetti after 1.2 seconds
  setTimeout(() => {
    confettiParticles = [];
  }, 1200);
}

function drawConfetti() {
  ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

  confettiParticles.forEach(p => {
    ctx.beginPath();
    ctx.fillStyle = p.color;
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();

    p.y += p.d;
  });
}


  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
  setInterval(drawConfetti, 30);
});
