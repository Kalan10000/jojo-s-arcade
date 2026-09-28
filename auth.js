/* ==========================================================================
   JOJO'S ARCADE - AUTHENTICATION & HIGH SCORES MANAGER
   ========================================================================== */

// Default Local Storage Database Key
const STORAGE_USERS_KEY = 'jojo_arcade_users';
const STORAGE_SESSION_KEY = 'jojo_arcade_session';
const STORAGE_SCORES_KEY = 'jojo_arcade_scores';

class ArcadeAuth {
    constructor() {
        this.currentUser = null;
        this.initSession();
    }

    // Initialize or restore session
    initSession() {
        const session = localStorage.getItem(STORAGE_SESSION_KEY);
        if (session) {
            try {
                this.currentUser = JSON.parse(session);
            } catch (e) {
                this.currentUser = null;
            }
        }
        this.updateUIState();
    }

    // Register a new user
    register(username, password) {
        if (!username || !password) {
            return { success: false, message: "Username and password are required." };
        }

        const users = JSON.parse(localStorage.getItem(STORAGE_USERS_KEY) || '[]');
        const existing = users.find(u => u.username.toLowerCase() === username.toLowerCase());

        if (existing) {
            return { success: false, message: "Username already exists." };
        }

        const newUser = {
            id: 'user_' + Date.now(),
            username: username,
            password: password, // Note: For production with Supabase/Firebase, hashing is handled automatically
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));

        // Auto login
        return this.login(username, password);
    }

    // Login existing user
    login(username, password) {
        const users = JSON.parse(localStorage.getItem(STORAGE_USERS_KEY) || '[]');
        const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);

        if (!user) {
            return { success: false, message: "Invalid username or password." };
        }

        this.currentUser = { id: user.id, username: user.username };
        localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(this.currentUser));
        this.updateUIState();

        return { success: true, user: this.currentUser };
    }

    // Logout current user
    logout() {
        this.currentUser = null;
        localStorage.removeItem(STORAGE_SESSION_KEY);
        this.updateUIState();
    }

    // Save high score for a game
    saveScore(gameId, score) {
        if (!this.currentUser) return false;

        const scores = JSON.parse(localStorage.getItem(STORAGE_SCORES_KEY) || '{}');
        if (!scores[this.currentUser.id]) {
            scores[this.currentUser.id] = {};
        }

        const currentBest = scores[this.currentUser.id][gameId] || 0;
        if (score > currentBest) {
            scores[this.currentUser.id][gameId] = score;
            localStorage.setItem(STORAGE_SCORES_KEY, JSON.stringify(scores));
            return true;
        }

        return false;
    }

    // Get user high scores for all games
    getUserHighScores() {
        if (!this.currentUser) return {};
        const scores = JSON.parse(localStorage.getItem(STORAGE_SCORES_KEY) || '{}');
        return scores[this.currentUser.id] || {};
    }

    // Update Header HUD status
    updateUIState() {
        const statusEl = document.getElementById('user-status-text');
        if (statusEl) {
            if (this.currentUser) {
                statusEl.innerText = `CONNECTED: ${this.currentUser.username.toUpperCase()}`;
                statusEl.className = "text-emerald-400 font-bold";
            } else {
                statusEl.innerText = "NOT LOGGED IN";
                statusEl.className = "text-pink-400 font-bold";
            }
        }
    }
}

// Global instance
window.arcadeAuth = new ArcadeAuth();