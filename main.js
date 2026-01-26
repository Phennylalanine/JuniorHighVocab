// main.js

window.addEventListener("DOMContentLoaded", () => {
  renderQuizCards();
  initMonsterHub();
  updateQuizCardLevels();
});

function updateQuizCardLevels() {
  document.querySelectorAll(".levelValue").forEach((span) => {
    const key = span.dataset.key;
    span.textContent = `(Level: ${localStorage.getItem(key) || 0})`;
  });
}
