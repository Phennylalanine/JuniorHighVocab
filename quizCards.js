// quizCards.js

const QUIZZES = [
  {
    icon: "🏛️",
    title: "Round 1 Buildings Quiz",
    jp: "建物クイズ 第1戦",
    url: "https://phennylalanine.github.io/Yach-6-Quiz-Home/BuildingS",
    levelKey: "buildingSlevelr",
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
