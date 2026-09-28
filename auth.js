// Arcade Hub Authentication & Score Persistence Manager

const STORAGE_KEYS = {
  USER: 'arcade_user_session',
  SCORES: 'arcade_high_scores'
};

// Default high scores
const defaultScores = {
  0: 0, // Game 1: Labyrinthe
  1: 0, // Game 2: Tour Infinie
  2: 0  // Game 3: Future Game
};

// Get current logged in user
function getCurrentUser() {
  const user = localStorage.getItem(STORAGE_KEYS.USER);
  return user ? JSON.parse(user) : null;
}

// Save logged in user
function setCurrentUser(username) {
  const userData = { username, loggedInAt: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
  updateAuthUI();
}

// Log out user
function logoutUser() {
  localStorage.removeItem(STORAGE_KEYS.USER);
  updateAuthUI();
}

// Fetch all high scores
function getScores() {
  const saved = localStorage.getItem(STORAGE_KEYS.SCORES);
  return saved ? JSON.parse(saved) : defaultScores;
}

// Save or update score for a specific cabinet/game index
function updateScore(gameId, score) {
  const scores = getScores();
  const currentBest = scores[gameId] || 0;

  if (score > currentBest) {
    scores[gameId] = score;
    localStorage.setItem(STORAGE_KEYS.SCORES, JSON.stringify(scores));
    renderHighScores();
    return true; // New high score achieved
  }
  return false;
}

// Render high scores onto the dashboard / DOM
function renderHighScores() {
  const scores = getScores();
  Object.keys(scores).forEach(gameId => {
    const scoreElement = document.getElementById(`high-score-${gameId}`);
    if (scoreElement) {
      scoreElement.textContent = scores[gameId];
    }
  });
}

// Update login state elements in UI
function updateAuthUI() {
  const user = getCurrentUser();
  const authStatus = document.getElementById('auth-status');
  const loginBtn = document.getElementById('login-btn');
  const logoutBtn = document.getElementById('logout-btn');

  if (user) {
    if (authStatus) authStatus.textContent = `Logged in as: ${user.username}`;
    if (loginBtn) loginBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'inline-block';
  } else {
    if (authStatus) authStatus.textContent = 'Playing as Guest';
    if (loginBtn) loginBtn.style.display = 'inline-block';
    if (logoutBtn) logoutBtn.style.display = 'none';
  }
}

// Listen for scores sent from Vercel games running inside the iframe overlay
window.addEventListener('message', (event) => {
  // Catch score event sent from iframe
  if (event.data && event.data.type === 'ARCADE_SCORE') {
    const receivedScore = parseInt(event.data.score, 10);
    const activeGameId = window.activeArcadeGameId;

    if (!isNaN(receivedScore) && activeGameId !== undefined) {
      const isNewRecord = updateScore(activeGameId, receivedScore);
      if (isNewRecord) {
        alert(`New High Score! ${receivedScore} points saved!`);
      } else {
        alert(`Game Over! Score: ${receivedScore}`);
      }
    }
  }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  updateAuthUI();
  renderHighScores();
});
