// Quiz State Variables
let currentQuestion = null; // will hold the current question object
let score = 0;
let combo = 0;
let level = 1;
let xp = 0;
let questions = [];
let answered = false;

const maxComboForBonus = 5;

// Metadata storage settings (kept in localStorage)
// Tracks: asked_count, last_asked_at (ISO), disabled_until (ISO)
// NOTE: META_KEY will be initialized after we load questions.json (derived from quizId).
let META_KEY = null;
const DEFAULT_META_KEY = "Lesson7Vocabulary1";
const ASK_THRESHOLD = 5; // number of times asked before cooldown triggers
const COOLDOWN_DAYS = 7; // cooldown length when threshold is reached

window.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const jpText = document.getElementById("jpText");
  const enText = document.getElementById("enText");
  const answerInput = document.getElementById("answerInput");
  const feedback = document.getElementById("feedback");
  const nextBtn = document.getElementById("nextBtn");
  const tryAgainBtn = document.getElementById("tryAgainBtn");
  const choicesContainer = document.getElementById("choicesText");

  const pointsEl = document.getElementById("points");
  const comboEl = document.getElementById("combo");
  const levelEl = document.getElementById("level");
  const xpBar = document.getElementById("xpBar");
  const xpText = document.getElementById("xpText");

  // Confetti
  const confettiCanvas = document.getElementById("confettiCanvas");
  const ctx = confettiCanvas ? confettiCanvas.getContext("2d") : null;
  let confettiParticles = [];

  // Event Listeners
  const startBtn = document.getElementById("startBtn");
  if (startBtn) startBtn.addEventListener("click", startQuiz);

  nextBtn.addEventListener("click", () => {
    if (answered) {
      loadNextQuestion();
    }
  });

  answerInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      if (!answered) {
        checkAnswer();
      } else if (!nextBtn.disabled) {
        nextBtn.click();
      }
    }
  });

  tryAgainBtn.addEventListener("click", tryAgain);

  // Load saved XP/Level progress
  loadProgress();

  // Helper to create a safe localStorage key from a string
  function sanitizeKey(s) {
    return String(s || "quiz").replace(/[^a-z0-9_-]/gi, "_").toLowerCase();
  }

  // Load questions (prefer questions.json; fallback to questions.csv)
  fetch("questions.json")
    .then((response) => {
      if (!response.ok) throw new Error("No questions.json");
      return response.json();
    })
    .then((data) => {
      // data may be either an array or an object with { quizId, title, version, questions: [...] }
      const list = Array.isArray(data) ? data : (data.questions || []);
      questions = normalizeQuestions(list);
      // set META_KEY from quizId if available
      const quizId = (data && data.quizId) ? data.quizId : "questions_json";
      META_KEY = `meta_${sanitizeKey(quizId)}_v1`;
      shuffleArray(questions);
      // Don't load question yet; wait for start
    })
    .catch(() => {
      // fallback to old CSV behaviour
      fetch("questions.csv")
        .then((response) => response.text())
        .then((data) => {
          questions = parseCSV(data);
          // normalize CSV-only items to include ids and metadata defaults
          questions = normalizeQuestions(questions);
          // set a reasonable META_KEY for CSV fallback
          META_KEY = `meta_${sanitizeKey("questions_csv")}_v1`;
          shuffleArray(questions);
        })
        .catch((err) => {
          console.error("Failed to load questions file:", err);
        });
    });

  // Confetti canvas resize and draw loop
  function resizeCanvas() {
    if (!confettiCanvas) return;
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
  }
  if (confettiCanvas) {
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
    setInterval(drawConfetti, 30);
  }

  // --- Metadata helpers (localStorage-backed) ---
  function getMetaKey() {
    return META_KEY || DEFAULT_META_KEY;
  }

  function loadMeta() {
    try {
      const raw = localStorage.getItem(getMetaKey());
      if (!raw) return {};
      return JSON.parse(raw);
    } catch (e) {
      console.warn("Failed to parse meta from localStorage:", e);
      return {};
    }
  }

  function saveMeta(meta) {
    try {
      localStorage.setItem(getMetaKey(), JSON.stringify(meta));
    } catch (e) {
      console.warn("Failed to save meta to localStorage:", e);
    }
  }

  // Helper to decrement a question's asked_count (not below 0).
  // We'll call this when a student makes a mistake so the item moves closer to cooldown.
  function decrementAskedCount(questionId, amount = 1) {
    try {
      const meta = loadMeta();
      const id = String(questionId);
      if (!meta[id]) meta[id] = { asked_count: 0, last_asked_at: null, disabled_until: null };
      meta[id].asked_count = Math.max(0, (meta[id].asked_count || 0) - amount);
      saveMeta(meta);
    } catch (e) {
      console.warn("Failed to decrement asked_count:", e);
    }
  }

  // Increment asked_count when a question is shown and apply cooldown when threshold reached
  // (This preserves the existing behavior: counting on show. If you'd rather count on answer,
  // move the call to markAskedOnShow into checkAnswer.)
  function markAskedOnShow(questionId, { threshold = ASK_THRESHOLD, cooldownDays = COOLDOWN_DAYS } = {}) {
    const meta = loadMeta();
    const id = String(questionId);
    if (!meta[id]) meta[id] = { asked_count: 0, last_asked_at: null, disabled_until: null };

    meta[id].asked_count = (meta[id].asked_count || 0) + 1;
    meta[id].last_asked_at = new Date().toISOString();

    if (meta[id].asked_count >= threshold) {
      const disabledUntil = new Date();
      disabledUntil.setDate(disabledUntil.getDate() + cooldownDays);
      meta[id].disabled_until = disabledUntil.toISOString();
      // reset asked_count after applying cooldown so the cycle restarts after cooldown
      meta[id].asked_count = 0;
    }

    saveMeta(meta);
  }

  // Utility: returns true if question is eligible to be asked now
  function isEligible(question) {
    const meta = loadMeta();
    const id = String(question.id);
    const itemMeta = meta[id];
    if (!itemMeta) return true;
    if (!itemMeta.disabled_until) return true;
    const disabledUntil = new Date(itemMeta.disabled_until);
    return disabledUntil <= new Date();
  }

  // Return an eligible question object or null if none available
  function pickNextQuestion({ preferLowerAskedCount = true } = {}) {
    const meta = loadMeta();
    const now = new Date();
    const eligible = questions.filter((q) => {
      const m = meta[String(q.id)] || {};
      if (!m.disabled_until) return true;
      return new Date(m.disabled_until) <= now;
    });

    if (eligible.length === 0) return null;

    if (preferLowerAskedCount) {
      // find minimum asked_count among eligible
      let min = Infinity;
      eligible.forEach((q) => {
        const c = (meta[String(q.id)] && meta[String(q.id)].asked_count) || 0;
        if (c < min) min = c;
      });
      const candidates = eligible.filter((q) => ((meta[String(q.id)] && meta[String(q.id)].asked_count) || 0) === min);
      return candidates[Math.floor(Math.random() * candidates.length)];
    } else {
      // random eligible
      return eligible[Math.floor(Math.random() * eligible.length)];
    }
  }

  // --- Function declarations ---

  function startQuiz() {
    if (!questions || questions.length === 0) {
      alert("Questions are still loading or none available.");
      return;
    }

    document.getElementById("quizScreen").classList.add("active");
    document.getElementById("startScreen").classList.remove("active");
    // Reset state
    score = 0;
    combo = 0;
    answered = false;
    // Optionally reset XP/level here if you want a fresh run each time
    // xp = 0;
    // level = 1;
    updateStats();
    loadNextQuestion();
  }

  function normalizeQuestions(arr) {
    // Accept either objects or CSV-parsed {jp,en}
    return arr.map((item, idx) => {
      // If already object with jp/en use it, else try to parse
      const obj = {};
      if (typeof item === "string") {
        // unlikely, but ignore
        obj.jp = item;
        obj.en = "";
      } else {
        obj.jp = item.jp || item.JP || "";
        obj.en = item.en || item.EN || item.english || "";
      }
      // Determine id: use provided id or index+1
      obj.id = item.id != null ? item.id : idx + 1;
      return obj;
    });
  }

  function parseCSV(data) {
    // CSV appears to be pipe-separated id| jp,en on each line (older format).
    // We'll try to be flexible.
    const lines = data.trim().split("\n");
    // If first line is header like "1| jp,en" we still attempt parsing.
    return lines
      .map((line) => {
        if (!line.trim()) return null;
        // if line contains pipe, split id and the rest
        if (line.indexOf("|") >= 0) {
          const [idPart, rest] = line.split("|");
          const id = parseInt(idPart.trim(), 10);
          const parts = rest.split(",");
          return { id: id, jp: (parts[0] || "").trim(), en: (parts[1] || "").trim() };
        } else {
          // fallback simple comma separated jp,en
          const parts = line.split(",");
          return { id: null, jp: (parts[0] || "").trim(), en: (parts[1] || "").trim() };
        }
      })
      .filter(Boolean);
  }

  function loadNextQuestion() {
    if (!questions || questions.length === 0) {
      jpText.textContent = "No questions loaded.";
      enText.textContent = "";
      answerInput.disabled = true;
      nextBtn.disabled = true;
      tryAgainBtn.style.display = "none";
      return;
    }

    const q = pickNextQuestion();
    if (!q) {
      // No eligible questions right now; inform the user.
      jpText.textContent = "No eligible questions available right now. Come back later!";
      enText.textContent = "";
      answerInput.disabled = true;
      nextBtn.disabled = true;
      tryAgainBtn.style.display = "none";
      currentQuestion = null;
      return;
    }

    // Set the selected question as current
    currentQuestion = q;

    // Mark that this question was asked (increment counts and apply cooldown if needed)
    markAskedOnShow(currentQuestion.id);

    jpText.textContent = currentQuestion.jp;
    // Hide English if you want a challenge, or show for easier mode
    enText.textContent = currentQuestion.en; // Set to "" if you want to hide answer
    speak(currentQuestion.en);

    if (choicesContainer) choicesContainer.innerHTML = "";

    answerInput.value = "";
    answerInput.disabled = false;
    answerInput.focus();

    feedback.textContent = "";
    feedback.style.color = "black";

    nextBtn.disabled = true;
    tryAgainBtn.style.display = "none";
    answered = false;

    updateStats(); // update any UI that relies on metadata (e.g., counts)
  }

  function checkAnswer() {
    if (answered) return;
    if (!currentQuestion) return;
    answered = true;

    const userAnswer = answerInput.value.trim();
    const correctAnswer = currentQuestion.en;

    if (userAnswer === correctAnswer) {
      feedback.innerHTML = "✔️ <strong>Correct!</strong>";
      feedback.style.color = "green";
      combo++;
      score += 1;

      const xpBonus = combo >= 15 && combo % 5 === 0 ? (combo / 5) - 1 : 1;
      gainXP(xpBonus);
      showFloatingXP(`+${xpBonus} XP`);

      updateStats();

      answerInput.disabled = true;
      nextBtn.disabled = false;
      tryAgainBtn.style.display = "none";
    } else {
      let comparison = "";
      const maxLength = Math.max(userAnswer.length, correctAnswer.length);

      for (let i = 0; i < maxLength; i++) {
        const userChar = userAnswer[i] || "";
        const correctChar = correctAnswer[i] || "";

        if (userChar === correctChar) {
          comparison += `<span style="color: green;">${correctChar}</span>`;
        } else if (userChar && correctChar) {
          comparison += `<span style="color: red;">${userChar}</span>`;
        } else if (!userChar) {
          comparison += `<span style="color: gray;">_</span>`;
        }
      }

      feedback.innerHTML =
        `✖️ <strong>Wrong!</strong><br>Your answer: <code>${comparison}</code><br>Correct answer: <span style="color: green;">${correctAnswer}</span>`;
      feedback.style.color = "red";
      combo = 0;

      // Decrement asked_count when the student makes a mistake so it moves closer to cooldown.
      // This implements: "If a student makes a mistake, we should remove 1 from the Ask Threshold".
      // (We reduce the stored asked_count by 1, not the global ASK_THRESHOLD.)
      decrementAskedCount(currentQuestion.id, 1);

      updateStats();

      answerInput.disabled = true;
      nextBtn.disabled = true;
      tryAgainBtn.style.display = "inline-block";
    }
  }

  function tryAgain() {
    feedback.textContent = "";
    feedback.style.color = "black";
    answerInput.disabled = false;
    answerInput.value = "";
    answerInput.focus();

    tryAgainBtn.style.display = "none";
    nextBtn.disabled = true;
    answered = false;
  }

  function gainXP(amount) {
    let levelBefore = level;
    xp += amount;

    while (xp >= xpToNextLevel(level)) {
      xp -= xpToNextLevel(level);
      level++;
      feedback.innerHTML += `<br>🎉 Level Up! You are now level ${level}`;
    }

    if (level > levelBefore) {
      triggerConfetti();
    }

    saveProgress();
    updateStats();
  }

  function xpToNextLevel(currentLevel) {
    let xpRequired = 3;
    for (let i = 2; i <= currentLevel; i++) {
      xpRequired += i;
    }
    return xpRequired;
  }

  function updateStats() {
    if (pointsEl) pointsEl.textContent = score;
    if (comboEl) comboEl.textContent = combo;
    if (levelEl) levelEl.textContent = level;

    const needed = xpToNextLevel(level);
    const percent = (xp / needed) * 100;
    if (xpBar) xpBar.style.width = `${Math.min(percent, 100)}%`;
    if (xpText) xpText.textContent = `${xp} / ${needed}`;
  }

  function saveProgress() {
    localStorage.setItem("buildingSxpr", xp);
    localStorage.setItem("buildingSlevelr", level);
  }

  function loadProgress() {
    const savedXP = localStorage.getItem("buildingSxpr");
    const savedLevel = localStorage.getItem("buildingSlevelr");

    if (savedXP !== null) xp = parseInt(savedXP, 10);
    if (savedLevel !== null) level = parseInt(savedLevel, 10);

    updateStats();
  }

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  function speak(text) {
    if (!text) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-UK";
    speechSynthesis.speak(utterance);
  }

  function showFloatingXP(text) {
    const xpElem = document.createElement("div");
    xpElem.textContent = text;
    xpElem.className = "floating-xp";
    xpElem.style.left = `${Math.random() * 80 + 10}%`;
    xpElem.style.top = "50%";
    document.body.appendChild(xpElem);
    setTimeout(() => xpElem.remove(), 1500);
  }

  function triggerConfetti() {
    for (let i = 0; i < 100; i++) {
      confettiParticles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * -20,
        r: Math.random() * 6 + 2,
        d: Math.random() * 5 + 1,
        color: "hsl(" + Math.floor(Math.random() * 360) + ", 100%, 70%)",
        tilt: Math.random() * 10 - 10,
      });
    }
  }

  function drawConfetti() {
    if (!ctx) return;
    ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    confettiParticles.forEach((p) => {
      ctx.beginPath();
      ctx.fillStyle = p.color;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2, true);
      ctx.fill();
    });
    updateConfetti();
  }

  function updateConfetti() {
    for (let i = 0; i < confettiParticles.length; i++) {
      const p = confettiParticles[i];
      p.y += p.d;
      p.x += Math.sin(p.tilt) * 2;

      if (p.y > confettiCanvas.height) {
        confettiParticles.splice(i, 1);
        i--;
      }
    }
  }
});
