// Arcade Hub Authentication & Score Persistence Manager[cite: 1]

const STORAGE_KEYS = {
  USERS: 'arcade_registered_users',
  USER: 'arcade_user_session',
  SCORES: 'arcade_high_scores'
};

// Default high scores for each cabinet/game ID
const defaultScores = {
  0: 0, // Game 1: Labyrinthe
  1: 0, // Game 2: Tour Infinie
  2: 0, // Game 3: Neon Overdrive
  3: 0, // Game 4: Spacial Master
  4: 0, // Game 5: La Juste Couleur
  99: 0 // Secret: Kalan's Games
};

class ArcadeAuthManager {
  constructor() {
    this.currentUser = this.getCurrentUser();
  }

  // Get current logged in user[cite: 1]
  getCurrentUser() {
    const user = localStorage.getItem(STORAGE_KEYS.USER);
    return user ? JSON.parse(user) : null;
  }

  getRegisteredUsers() {
    const users = localStorage.getItem(STORAGE_KEYS.USERS);
    return users ? JSON.parse(users) : {};
  }

  register(username, password) {
    if (!username || !password) {
      return { success: false, message: 'Username and password required.' };
    }
    const users = this.getRegisteredUsers();
    if (users[username]) {
      return { success: false, message: 'Username already exists.' };
    }
    users[username] = { password, createdAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    return this.login(username, password);
  }

  login(username, password) {
    if (!username || !password) {
      return { success: false, message: 'Username and password required.' };
    }
    const users = this.getRegisteredUsers();
    if (!users[username] || users[username].password !== password) {
      return { success: false, message: 'Invalid username or password.' };
    }
    const userData = { username, loggedInAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
    this.currentUser = userData;
    return { success: true };
  }

  logout() {
    localStorage.removeItem(STORAGE_KEYS.USER);
    this.currentUser = null;
  }

  getAllScores() {
    const saved = localStorage.getItem(STORAGE_KEYS.SCORES);
    return saved ? JSON.parse(saved) : {};
  }

  getUserHighScores() {
    if (!this.currentUser) return { ...defaultScores };
    const allScores = this.getAllScores();
    return allScores[this.currentUser.username] || { ...defaultScores };
  }

  updateScore(gameId, score) {
    if (!this.currentUser) return false;
    const allScores = this.getAllScores();
    const userScores = allScores[this.currentUser.username] || { ...defaultScores };
    const currentBest = userScores[gameId] || 0;

    if (score > currentBest) {
      userScores[gameId] = score;
      allScores[this.currentUser.username] = userScores;
      localStorage.setItem(STORAGE_KEYS.SCORES, JSON.stringify(allScores));
      return true; // New high score achieved
    }
    return false;
  }
}

// Expose global auth manager instance
window.arcadeAuth = new ArcadeAuthManager();

// Listen for score events sent from games via iframe postMessage[cite: 1]
window.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'ARCADE_SCORE') {
    const receivedScore = parseInt(event.data.score, 10);
    const gameId = parseInt(event.data.gameId, 10);

    if (!isNaN(receivedScore) && !isNaN(gameId)) {
      const isNewRecord = window.arcadeAuth.updateScore(gameId, receivedScore);
      if (isNewRecord) {
        alert(`New High Score! ${receivedScore} points saved!`);
      }
    }
  }
});
