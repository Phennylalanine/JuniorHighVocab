/**
 * Lesson 7-1 Quiz Logic
 * Handles a vocabulary quiz with XP, leveling, and persistent progress tracking.
 */

// =========================
// Quiz State Variables
// =========================
let currentQuestion = null; // Stores the object for the active question
let score = 0;             // Tracks correct answers for the current session
let combo = 0;             // Tracks consecutive correct answers
let level = 1;             // User's current level (loaded from storage)
let xp = 0;                // Current experience points toward next level
let questions = [];        // Array of all normalized question objects
let answered = false;      // Flag to prevent multiple submissions for one question

const maxComboForBonus = 5;

// =========================
// Metadata / Cooldown Settings
// =========================
let META_KEY = null;
const DEFAULT_META_KEY = "Lesson7Vocabulary1";
const ASK_THRESHOLD = 5;    // Threshold for showing progress reviews
const COOLDOWN_DAYS = 7;    // Time limit for specific quiz resets

window.addEventListener("DOMContentLoaded", () => {
  // =========================
  // DOM Elements - Selection
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
  // Confetti Animation Setup
  // =========================
  const confettiCanvas = document.getElementById("confettiCanvas");
  const ctx = confettiCanvas.getContext("2d");
  let confettiParticles = [];

  // =========================
  // UI Event Listeners
  // =========================
  startBtn.addEventListener("click", startQuiz);

  nextBtn.addEventListener("click", () => {
    if (answered) loadNextQuestion();
  });

  // Handle "Enter" key for both submitting and proceeding
  answerInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      if (!answered) checkAnswer();
      else if (!nextBtn.disabled) nextBtn.click();
    }
  });

  tryAgainBtn.addEventListener("click", tryAgain);

  // Restore previous level and XP from localStorage
  loadProgress();

  // =========================
  // Data Loading
  // =========================
  fetch("questions.json")
    .then(res => res.json())
    .then(data => {
      // Handle various JSON formats (direct array or nested object)
      const list = Array.isArray(data) ? data : data.questions;
      questions = normalizeQuestions(list);
      META_KEY = "meta_lesson7_v1";
      shuffleArray(questions); // Randomize question order on load
    })
    .catch(err => {
      console.error("Failed to load questions:", err);
    });

  // =========================
  // Quiz Control Flow
  // =========================
  
  /**
   * Switches from the start screen to the active quiz interface.
   */
  function startQuiz() {
    if (!questions || questions.length === 0) {
      alert("Questions are still loading.");
      return;
    }

    const startScreen = document.getElementById("startScreen");
    const quizScreen = document.getElementById("quizScreen");

    // UI Transition
    startScreen.classList.add("hidden");
    startScreen.classList.remove("active");
    quizScreen.classList.remove("hidden");
    quizScreen.classList.add("active");

    // Reset session stats
    score = 0;
    combo = 0;
    answered = false;

    updateStats();
    loadNextQuestion();
  }

  /**
   * Formats raw question data to ensure consistent property names.
   */
  function normalizeQuestions(arr) {
    return arr.map((q, i) => ({
      id: q.id ?? i + 1,
      jp: q.jp,
      en: q.en
    }));
  }

  /**
   * Selects a random question and resets the input field.
   */
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

    // Trigger text-to-speech for the new question
    speak(currentQuestion.en);
  }

  // =========================
  // Answer Processing
  // =========================

  /**
   * Compares user input with the correct English answer.
   */
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
      gainXP(1); // Increment progression
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

  /**
   * Resets UI for a second attempt on the same question (no XP reward).
   */
  function tryAgain() {
    feedback.textContent = "";
    answerInput.disabled = false;
    answerInput.value = "";
    answerInput.focus();
    tryAgainBtn.style.display = "none";
    answered = false;
  }

  // =========================
  // XP & Leveling System
  // =========================

  /**
   * Adds XP and checks if the user has reached a new level.
   */
  function gainXP(amount) {
    xp += amount;
    if (xp >= xpToNextLevel(level)) {
      xp = 0;
      level++;
      triggerConfetti(); // Visual reward for leveling up
    }
    saveProgress();
    updateStats();
  }

  /**
   * Calculation for increasing difficulty (required XP per level).
   */
  function xpToNextLevel(lv) {
    return 3 + lv * 2;
  }

  /**
   * Synchronizes internal variables with the DOM elements.
   */
  function updateStats() {
    pointsEl.textContent = score;
    comboEl.textContent = combo;
    levelEl.textContent = level;

    const needed = xpToNextLevel(level);
    xpBar.style.width = `${(xp / needed) * 100}%`;
  }

  /**
   * Persists progress data to the browser's local storage.
   */
  function saveProgress() {
    localStorage.setItem("lesson7_xp", xp);
    localStorage.setItem("lesson7-1sLevelr", level);
   }

  /**
   * Retrieves data from storage on initial load.
   */
  function loadProgress() {
    xp = Number(localStorage.getItem("lesson7_xp")) || 0;
    level = Number(localStorage.getItem("lesson7-1sLevelr")) || 1;
    updateStats();
  }

  // =========================
  // Utilities & Visuals
  // =========================

  /**
   * Randomizes array items using the Fisher-Yates algorithm.
   */
  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  /**
   * Uses Web Speech API to provide audio feedback.
   */
  function speak(text) {
    if (!text) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-UK";
    speechSynthesis.speak(u);
  }

  /**
   * Generates confetti particles for celebrations.
   */
  function triggerConfetti() {
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
    // Stop the falling effect after a short delay
    setTimeout(() => { confettiParticles = []; }, 1200);
  }

  /**
   * Renders the movement of confetti particles on the canvas.
   */
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

  // Handle canvas sizing and animation loop
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
  setInterval(drawConfetti, 30);
});
