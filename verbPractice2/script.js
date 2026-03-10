/* =========================
   Configuration & State
   ========================= */
const QUIZ_ID = "verbPractice2"; // A unique name for this quiz so its saved data does not mix with other quizzes
const DATA_FILE = "./questions.json"; // The file that contains the quiz questions
const MASTER_LIMIT = 3; // Number of correct answers needed before a word is considered "mastered"

let globalProfile = { level: 1, xp: 0, totalCorrect: 0 }; // Stores the player's overall progress like level and experience points
let sessionStats = { created: Date.now(), words: {} }; // Tracks progress for this quiz session and the words practiced
let questions = []; // Will hold the list of quiz questions loaded from the JSON file
let currentQuestion = null; // Stores the current question being shown
let score = 0; // Counts how many correct answers were given in this session
let combo = 0; // Tracks how many correct answers were given in a row

/* DOM ELEMENTS */
const startBtn = document.getElementById("startBtn"); // Gets the Start button from the webpage
const nextBtn = document.getElementById("nextBtn"); // Gets the Next button from the webpage
const tryAgainBtn = document.getElementById("tryAgainBtn"); // Gets the Try Again button from the webpage
const jpText = document.getElementById("jpText"); // Area where the Japanese text is displayed
const enText = document.getElementById("enText"); // Area where the English word is displayed
const input = document.getElementById("answerInput"); // The input box where the user types their answer
const feedback = document.getElementById("feedback"); // Area where feedback messages (correct/wrong) are shown
const pointsEl = document.getElementById("points"); // Element that displays the current score
const comboEl = document.getElementById("combo"); // Element that displays the combo count
const levelEl = document.getElementById("level"); // Element that shows the player's level
const xpBar = document.getElementById("xpBar"); // Visual progress bar showing XP progress
const xpText = document.getElementById("xpText"); // Text showing XP numbers
const inProgressList = document.getElementById("inProgressList"); // Panel listing words still being learned
const masteredList = document.getElementById("masteredList"); // Panel listing words already mastered

function speak(text) { // Function to read a word aloud using the browser speech system
  window.speechSynthesis.cancel(); // Stops any speech that might already be playing
  const msg = new SpeechSynthesisUtterance(text); // Creates a speech message containing the text
  msg.lang = 'en-US'; // Sets the spoken language to American English
  msg.rate = 0.9; // Slightly slows down the speaking speed
  window.speechSynthesis.speak(msg); // Plays the spoken word
}

/* =========================
   Initialization
   ========================= */
async function init() { // Runs when the quiz first loads
  const savedProfile = localStorage.getItem(QUIZ_ID + "_profile"); // Looks for previously saved player data in the browser
  if (savedProfile) globalProfile = JSON.parse(savedProfile); // If data exists, load it into the profile
  
  const savedSession = localStorage.getItem("quiz_session_" + QUIZ_ID); // Looks for saved progress from a recent session
  if (savedSession) { // If session data exists
    const data = JSON.parse(savedSession); // Convert stored text back into usable data
    if ((Date.now() - data.created) < 172800000) sessionStats = data; // Only restore it if it is less than 48 hours old
  }

  try {
    const res = await fetch(DATA_FILE); // Request the questions file from the server
    const data = await res.json(); // Convert the file contents from JSON format into JavaScript data
    questions = data.questions; // Store the list of questions
  } catch (e) {
    console.error("Data load error", e); // If loading fails, print an error in the browser console
  }

  updateStats(); // Update the score, level, and XP display
  updatePanel(); // Update the side panels showing learning progress
  
  if (!localStorage.getItem(QUIZ_ID + "_level")) { // If no level has been saved yet
      localStorage.setItem(QUIZ_ID + "_level", globalProfile.level); // Save the starting level
  }
}

/* =========================
   Game Loop
   ========================= */
function loadNext() { // Chooses and displays the next quiz question
  const pool = questions.filter(q => { // Create a list of questions that are not yet mastered
    const k = q.en + "|" + q.jp; // Create a unique key using the English and Japanese text
    return (sessionStats.words[k]?.correct || 0) < MASTER_LIMIT; // Include it only if mastery count is below the limit
  });

  if (pool.length === 0) { // If there are no more questions left to learn
    alert("Incredible! You have mastered this level!"); // Show a congratulation message
    location.reload(); // Reload the page to restart
    return; // Stop the function
  }

  currentQuestion = pool[Math.floor(Math.random() * pool.length)]; // Pick a random question from the pool
  const key = currentQuestion.en + "|" + currentQuestion.jp; // Create its unique key
  const currentMastery = sessionStats.words[key]?.correct || 0; // Find how many times the user has answered it correctly

  if (currentMastery === 0) { // If this word has never been answered correctly before
    jpText.textContent = currentQuestion.jp; // Show the Japanese text
    enText.textContent = currentQuestion.en; // Show the English word
    enText.style.opacity = "1"; // Make it fully visible
    feedback.innerHTML = `<span style="color: #6366f1;">First time! Type the word to learn it (+1 XP).</span>`; // Show learning message
  } else {
    jpText.textContent = currentQuestion.jp; // Show the Japanese text
    enText.textContent = "????"; // Hide the English word
    enText.style.opacity = "0.3"; // Make it faint
    feedback.textContent = ""; // Clear previous feedback
  }
  
  speak(currentQuestion.en); // Play the pronunciation of the English word

  input.value = ""; // Clear the input box
  input.disabled = false; // Allow typing
  input.classList.remove("success-input", "shake-input"); // Remove any animation styles
  input.focus(); // Move the cursor into the input box
  nextBtn.classList.add("hidden"); // Hide the Next button
  tryAgainBtn.classList.add("hidden"); // Hide the Try Again button
}

/* =========================
   ANSWER CHECKING
   ========================= */
function checkAnswer() { // Runs when the user presses Enter to submit an answer
  const user = input.value.trim().toLowerCase(); // Take the user's answer, remove spaces, and convert to lowercase
  const correct = currentQuestion.en.toLowerCase(); // Get the correct answer in lowercase
  if (!user || input.disabled) return; // If the input is empty or disabled, stop

  if (user === correct) { // If the user typed the correct word
    feedback.innerHTML = "✔️ <strong>Correct!</strong>"; // Show a success message
    feedback.className = "correct-style"; // Apply styling for correct answers
    input.classList.add("success-input"); // Add visual success animation
    input.disabled = true; // Prevent further typing

    score++; combo++; // Increase score and combo count
    updateProgress(currentQuestion, true); // Update learning progress
    
    setTimeout(() => { loadNext(); }, 800); // Wait briefly then load the next question
  } else {
    input.classList.add("shake-input"); // Add shaking animation to show mistake
    setTimeout(() => input.classList.remove("shake-input"), 400); // Remove the shake after 0.4 seconds
    
    let comparison = ""; // Prepare a visual comparison of letters
    const maxLength = Math.max(user.length, correct.length); // Determine longest length between the two words
    for (let i = 0; i < maxLength; i++) { // Compare each letter position
        const uChar = user[i] || ""; // Get the user's character or empty
        const cChar = correct[i] || ""; // Get the correct character or empty
        if (uChar === cChar) comparison += `<span style="color: #10b981;">${cChar}</span>`; // Green if correct letter
        else if (uChar && cChar) comparison += `<span style="color: #ef4444;">${uChar}</span>`; // Red if wrong letter
        else if (!uChar) comparison += `<span style="color: #94a3b8;">_</span>`; // Grey underscore if missing letter
    }

    enText.textContent = currentQuestion.en; // Reveal the correct English word
    enText.style.opacity = "1"; // Make it fully visible
    feedback.innerHTML = `✖️ <strong>Wrong!</strong><br>You: <code>${comparison}</code><br><span style="color: #ef4444;">Penalty: -1 Learning XP. Re-learn it now!</span>`; // Show error feedback

    combo = 0; // Reset combo streak
    updateProgress(currentQuestion, false); // Update progress as incorrect
    
    tryAgainBtn.classList.remove("hidden"); // Show Try Again button
    tryAgainBtn.focus(); // Move cursor to the Try Again button
  }
}

/* =========================
   DATA & XP MANAGEMENT (Updated)
   ========================= */
function updateProgress(q, isCorrect) { // Updates learning progress and XP
  const key = q.en + "|" + q.jp; // Create unique key for the word
  if (!sessionStats.words[key]) sessionStats.words[key] = { en: q.en, jp: q.jp, correct: 0 }; // Create entry if it doesn't exist
  
  const oldMastery = sessionStats.words[key].correct; // Save previous mastery level

  if (isCorrect) { // If the answer was correct
    sessionStats.words[key].correct++; // Increase mastery count
    const newMastery = sessionStats.words[key].correct; // Store updated mastery

    if (oldMastery === 0) { // If this is the first correct time
        globalProfile.xp += 1; // Award 1 XP
    }

    if (newMastery === MASTER_LIMIT) { // If the word has reached mastery level
        globalProfile.xp += 2; // Give bonus XP
    }

    let needed = 10 + globalProfile.level * 3; // Calculate XP needed for next level
    if (globalProfile.xp >= needed) { // If enough XP has been earned
      globalProfile.xp -= needed; // Remove XP used to level up
      globalProfile.level++; // Increase player level
      localStorage.setItem(QUIZ_ID + "_level", globalProfile.level); // Save the new level
    }
  } else {
    if (oldMastery >= 1) { // If the word had already been learned before
        globalProfile.xp = Math.max(0, globalProfile.xp - 1); // Remove 1 XP but never go below zero
    }
    sessionStats.words[key].correct = 0; // Reset mastery count for that word
  }
  
  localStorage.setItem(QUIZ_ID + "_profile", JSON.stringify(globalProfile)); // Save updated profile
  localStorage.setItem("quiz_session_" + QUIZ_ID, JSON.stringify(sessionStats)); // Save session progress
  updateStats(); // Refresh displayed stats
  updatePanel(); // Refresh word progress panels
}

function updateStats() { // Updates the visible stats on the screen
  if (pointsEl) pointsEl.textContent = score; // Display current score
  if (comboEl) comboEl.textContent = combo; // Display combo streak
  if (levelEl) levelEl.textContent = globalProfile.level; // Display current level
  const needed = 10 + globalProfile.level * 3; // Calculate XP needed for next level
  if (xpText) xpText.textContent = `${globalProfile.xp} / ${needed}`; // Show XP numbers
  if (xpBar) xpBar.style.width = (globalProfile.xp / needed) * 100 + "%"; // Adjust XP progress bar width
}

function updatePanel() { // Updates the side panels showing word progress
  if (!inProgressList || !masteredList) return; // Stop if panels are missing
  inProgressList.innerHTML = ""; // Clear in-progress list
  masteredList.innerHTML = ""; // Clear mastered list

  Object.values(sessionStats.words) // Get all tracked words
    .sort((a,b) => b.correct - a.correct) // Sort by highest mastery first
    .forEach(w => { // Process each word
      const row = document.createElement("div"); // Create a row element
      row.className = "session-row"; // Assign a style class
      row.textContent = `${w.en}: ${w.correct}/${MASTER_LIMIT}`; // Show word and mastery score
      
      if (w.correct >= MASTER_LIMIT) { // If the word is mastered
        row.classList.add("score-mastered"); // Apply mastered style
        masteredList.appendChild(row); // Add it to mastered list
      } else {
        if (w.correct === 0) row.classList.add("score-0"); // Style for zero progress
        else if (w.correct === 1) row.classList.add("score-1"); // Style for level 1 progress
        else if (w.correct === 2) row.classList.add("score-2"); // Style for level 2 progress
        inProgressList.appendChild(row); // Add it to in-progress list
      }
    });
}

/* =========================
   Event Listeners
   ========================= */
startBtn.addEventListener("click", () => { // Runs when the Start button is clicked
  document.getElementById("startScreen").classList.add("hidden"); // Hide start screen
  document.getElementById("quizScreen").classList.remove("hidden"); // Show quiz screen
  document.getElementById("quizScreen").classList.add("active"); // Mark quiz screen as active
  loadNext(); // Load the first question
});

nextBtn.addEventListener("click", loadNext); // When Next button is clicked, load another question

tryAgainBtn.addEventListener("click", () => { // Runs when Try Again button is clicked
  input.value = ""; // Clear the input box
  input.classList.remove("shake-input"); // Remove shaking animation
  input.focus(); // Place cursor back in input
  feedback.textContent = ""; // Clear feedback message
  tryAgainBtn.classList.add("hidden"); // Hide the Try Again button
});

input.addEventListener("keydown", e => { // Listen for keyboard presses in the input box
  if (e.key === "Enter") { // If the Enter key is pressed
    checkAnswer(); // Check the user's answer
  }
});

init(); // Start the initialization process when the script loads
