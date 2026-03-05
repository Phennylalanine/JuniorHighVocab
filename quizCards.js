/**
 * quizCards.js
 * Contains the database of available quizzes and handles 
 * the dynamic generation of quiz UI components.
 */

// List of available quizzes with their metadata
const QUIZZES = [

 {
    icon: "🏃",
    title: "Verbs Part 1",
    jp: "現在形と過去分詞",
    url: "https://phennylalanine.github.io/JuniorHighVocab/verbPractice/",
    levelKey: "verbPractice_level", // Key used to track progress in localStorage
  },
   {
    icon: "🏃🏃",
    title: "Verbs Part 2",
    jp: "現在形と過去分詞",
    url: "https://phennylalanine.github.io/JuniorHighVocab/verbPractice2/",
    levelKey: "verbPractice2_level", // Key used to track progress in localStorage
  },
    {
    icon: "🏃🏃🏃",
    title: "Verbs Part 3",
    jp: "現在形と過去分詞",
    url: "https://phennylalanine.github.io/JuniorHighVocab/verbPractice3/",
    levelKey: "verbPractice3_level", // Key used to track progress in localStorage
  },
    {
    icon: "🏃🏃🏃🏃",
    title: "Verbs Part 4",
    jp: "現在形と過去分詞",
    url: "https://phennylalanine.github.io/JuniorHighVocab/verbPractice4/",
    levelKey: "verbPractice4_level", // Key used to track progress in localStorage
  },
      {
    icon: "🏃🏃🏃🏃🏃",
    title: "Verbs Part 5",
    jp: "現在形と過去分詞",
    url: "https://phennylalanine.github.io/JuniorHighVocab/verbPractice5/",
    levelKey: "verbPractice5_level", // Key used to track progress in localStorage
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
