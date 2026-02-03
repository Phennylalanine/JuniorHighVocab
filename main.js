/**
 * main.js
 * Primary entry point for the application.
 * Manages the initial page load logic and UI updates for quiz levels.
 */

// Initialize the application once the DOM content is fully loaded
window.addEventListener("DOMContentLoaded", () => {
  renderQuizCards();      // Populates the quiz grid from quizCards.js
  initMonsterHub();       // Calculates and displays the monster/level header
  updateQuizCardLevels(); // Pulls individual quiz progress from local storage
});

/**
 * Updates the UI labels for each quiz card with the latest scores.
 * Searches for all elements with the 'levelValue' class and fills them
 * with data from localStorage based on their specific progress key.
 */
function updateQuizCardLevels() {
  document.querySelectorAll(".levelValue").forEach((span) => {
    const key = span.dataset.key;
    // Retrieve stored level or default to 0 if no progress exists
    const levelValue = localStorage.getItem(key) || 0;
    span.textContent = `(Level: ${levelValue})`;
  });
}
