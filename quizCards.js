/**
 * quizCards.js
 * Contains the database of available quizzes and handles 
 * the dynamic generation of quiz UI components.
 */

// List of available quizzes with their metadata
const QUIZZES = [
  {
    icon: "🏛️",
    title: "Lesson 7-1 Quiz",
    jp: "7-1 第1戦",
    url: "https://phennylalanine.github.io/JuniorHighVocab/Lesson7-1/",
    levelKey: "lesson7-1sLevelr", // Key used to track progress in localStorage
  },
 {
    icon: "🏃",
    title: "Verbs Part 1",
    jp: "現在形と過去分詞",
    url: "https://phennylalanine.github.io/JuniorHighVocab/verbPractice/",
    levelKey: "verb1Levelr", // Key used to track progress in localStorage
  },
  
  // Add more quiz objects here...
];

/**
 * Loops through the QUIZZES array and builds the HTML layout
 * for the interactive grid in the main section.
 */
function renderQuizCards() {
  const grid = document.getElementById("quizGrid");
  if (!grid) return;

  // Clear existing content before rendering
  grid.innerHTML = "";

  QUIZZES.forEach((q) => {
    const card = document.createElement("article");
    card.className = "quiz-card";

    // Build the card structure using template literals
    card.innerHTML = `
      <div class="quiz-icon">${q.icon}</div>
      <h3>${q.title}</h3>
      <p>${q.jp}</p>
      <a href="${q.url}" target="_blank" rel="noopener">Start</a>
      ${
        q.levelKey
          ? `<span class="levelValue" data-key="${q.levelKey}">(Level: 0)</span>`
          : ""
      }
    `;

    grid.appendChild(card);
  });
}
