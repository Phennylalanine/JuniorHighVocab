// quizCards.js

const QUIZZES = [
  {
    icon: "🏛️",
    title: "Lesson 7-1 Quiz",
    jp: "7-1 第1戦",
    url: "https://phennylalanine.github.io/JuniorHighVocab/Lesson7-1/",
    levelKey: "lesson7-1sLevelr",
  },
  // ...
];

function renderQuizCards() {
  const grid = document.getElementById("quizGrid");
  if (!grid) return;

  grid.innerHTML = "";

  QUIZZES.forEach((q) => {
    const card = document.createElement("article");
    card.className = "quiz-card";

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
