/**
 * ===================================================
 * TETRIS GAME - CONTOH INTEGRASI & API USAGE
 * ===================================================
 * 
 * File ini berisi contoh-contoh penggunaan game Tetris
 * dalam berbagai skenario dan integrasi
 */

// ========================================
// 1. BASIC INTEGRATION EXAMPLES
// ========================================

/**
 * Contoh 1.1: Embed game di dalam website
 * ========================================
 */

// Method 1: Menggunakan iframe
// <iframe src="tetris-game.html" width="900" height="700"></iframe>

// Method 2: Menggunakan modal popup
function openGameModal() {
    const modal = document.createElement('div');
    modal.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
                    background: rgba(0,0,0,0.8); display: flex; align-items: center; 
                    justify-content: center; z-index: 9999;">
            <div style="position: relative; width: 90%; max-width: 900px; height: 90vh;">
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="position: absolute; top: -40px; right: 0; z-index: 10000;">
                    Close ✕
                </button>
                <iframe src="tetris-game.html" style="width: 100%; height: 100%; border: none;"></iframe>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Method 3: Direct DOM embedding (lebih kompleks)
// Embed script langsung ke halaman


/**
 * Contoh 1.2: Track dan simpan game data ke server
 * ==================================================
 */

class GameDataTracker {
    constructor() {
        this.gameData = {
            sessionId: this.generateSessionId(),
            startTime: new Date(),
            moves: [],
            scores: [],
            linesClear: []
        };
    }

    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    recordMove(moveType, details) {
        this.gameData.moves.push({
            timestamp: Date.now(),
            type: moveType, // 'left', 'right', 'down', 'rotate', 'drop'
            details: details
        });
    }

    recordScore(score, level, lines) {
        this.gameData.scores.push({
            timestamp: Date.now(),
            score: score,
            level: level,
            lines: lines
        });
    }

    recordLinesClear(count, points) {
        this.gameData.linesClear.push({
            timestamp: Date.now(),
            count: count,
            points: points
        });
    }

    async sendToServer(endpoint = '/api/tetris/scores') {
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sessionId: this.gameData.sessionId,
                    duration: Date.now() - this.gameData.startTime,
                    finalScore: this.getLatestScore(),
                    totalMoves: this.gameData.moves.length,
                    totalLinesClear: this.gameData.linesClear.reduce((a, b) => a + b.count, 0),
                    gameData: this.gameData
                })
            });
            return await response.json();
        } catch (error) {
            console.error('Error sending game data:', error);
        }
    }

    getLatestScore() {
        return this.gameData.scores.length > 0 
            ? this.gameData.scores[this.gameData.scores.length - 1].score 
            : 0;
    }

    exportAsJSON() {
        return JSON.stringify(this.gameData, null, 2);
    }

    exportAsCSV() {
        const rows = [
            ['Timestamp', 'Type', 'Score', 'Level', 'Lines'],
            ...this.gameData.scores.map(s => [
                new Date(s.timestamp).toISOString(),
                'score',
                s.score,
                s.level,
                s.lines
            ])
        ];
        return rows.map(r => r.join(',')).join('\n');
    }
}

// Penggunaan:
// const tracker = new GameDataTracker();
// tracker.recordScore(1000, 5, 10);
// tracker.sendToServer();


/**
 * Contoh 1.3: Multiplayer leaderboard integration
 * ================================================
 */

class LeaderboardManager {
    constructor(endpoint = '/api/leaderboard') {
        this.endpoint = endpoint;
        this.leaderboard = [];
    }

    async addScore(playerName, score, level, lines) {
        try {
            const response = await fetch(this.endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    playerName: playerName,
                    score: score,
                    level: level,
                    lines: lines,
                    timestamp: new Date().toISOString()
                })
            });
            return await response.json();
        } catch (error) {
            console.error('Error adding score:', error);
        }
    }

    async getTopScores(limit = 10) {
        try {
            const response = await fetch(`${this.endpoint}?limit=${limit}`);
            this.leaderboard = await response.json();
            return this.leaderboard;
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
        }
    }

    displayLeaderboard() {
        const html = `
            <div style="border: 1px solid #ccc; padding: 20px; margin: 20px 0;">
                <h2>🏆 Top Scores Leaderboard</h2>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f0f0f0;">
                            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ccc;">Rank</th>
                            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ccc;">Player</th>
                            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ccc;">Score</th>
                            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ccc;">Level</th>
                            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ccc;">Lines</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.leaderboard.map((entry, index) => `
                            <tr style="border-bottom: 1px solid #eee;">
                                <td style="padding: 10px;">${index + 1}</td>
                                <td style="padding: 10px;">${entry.playerName}</td>
                                <td style="padding: 10px; font-weight: bold;">${entry.score}</td>
                                <td style="padding: 10px;">${entry.level}</td>
                                <td style="padding: 10px;">${entry.lines}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        return html;
    }
}

// Penggunaan:
// const leaderboard = new LeaderboardManager();
// await leaderboard.getTopScores(10);
// document.body.innerHTML += leaderboard.displayLeaderboard();


// ========================================
// 2. ADVANCED CUSTOMIZATION EXAMPLES
// ========================================

/**
 * Contoh 2.1: Custom Tetromino Generator
 * ======================================
 */

class CustomTetrisGame {
    constructor(options = {}) {
        this.options = {
            difficulty: options.difficulty || 'normal',
            enableGhostPiece: options.enableGhostPiece !== false,
            enableHold: options.enableHold !== false,
            enableSoundEffects: options.enableSoundEffects !== false,
            customTetrominos: options.customTetrominos || {}
        };
    }

    addCustomTetromino(name, shape, color) {
        this.options.customTetrominos[name] = { shape, color, name };
    }

    getAvailableTetrominos() {
        return {
            ...this.getDefaultTetrominos(),
            ...this.options.customTetrominos
        };
    }

    getDefaultTetrominos() {
        return {
            I: { shape: [[1,1,1,1]], color: '#00f0f0', name: 'I' },
            O: { shape: [[1,1],[1,1]], color: '#f0f000', name: 'O' },
            // ... other tetrominos
        };
    }

    setDifficulty(level) {
        const difficulties = {
            'easy': { dropSpeed: 1000, scoreMultiplier: 0.5 },
            'normal': { dropSpeed: 800, scoreMultiplier: 1.0 },
            'hard': { dropSpeed: 500, scoreMultiplier: 1.5 },
            'insane': { dropSpeed: 300, scoreMultiplier: 2.0 }
        };
        this.options.difficulty = level;
        return difficulties[level];
    }
}

// Penggunaan:
// const game = new CustomTetrisGame({ difficulty: 'hard' });
// game.addCustomTetromino('CUSTOM', [[1,1,1],[1,0,0],[1,0,0]], '#ff00ff');


/**
 * Contoh 2.2: Sound effects manager
 * ==================================
 */

class GameSoundManager {
    constructor(options = {}) {
        this.sounds = {};
        this.muted = options.muted || false;
        this.volume = options.volume || 0.5;

        // Define default sounds
        this.addSound('move', '/sounds/move.wav');
        this.addSound('rotate', '/sounds/rotate.wav');
        this.addSound('drop', '/sounds/drop.wav');
        this.addSound('clear-line', '/sounds/clear-line.wav');
        this.addSound('level-up', '/sounds/level-up.wav');
        this.addSound('game-over', '/sounds/game-over.wav');
    }

    addSound(name, path) {
        const audio = new Audio(path);
        audio.volume = this.volume;
        this.sounds[name] = audio;
    }

    playSound(name) {
        if (this.muted) return;
        if (this.sounds[name]) {
            this.sounds[name].currentTime = 0;
            this.sounds[name].play().catch(e => console.log('Sound play failed:', e));
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        return this.muted;
    }

    setVolume(level) {
        this.volume = Math.max(0, Math.min(1, level));
        Object.values(this.sounds).forEach(audio => {
            audio.volume = this.volume;
        });
    }

    preloadSounds() {
        Object.values(this.sounds).forEach(audio => {
            audio.load();
        });
    }
}

// Penggunaan:
// const soundManager = new GameSoundManager();
// soundManager.playSound('move');
// soundManager.setVolume(0.7);


/**
 * Contoh 2.3: Settings dan preferences manager
 * =============================================
 */

class GameSettings {
    constructor() {
        this.defaults = {
            controlScheme: 'standard', // standard, dvorak, custom
            ghostPiece: true,
            holdPiece: true,
            gridLines: true,
            soundEffects: true,
            music: false,
            volume: 0.5,
            difficulty: 'normal',
            theme: 'dark' // dark, light, custom
        };
        this.settings = this.loadSettings();
    }

    loadSettings() {
        const saved = localStorage.getItem('tetrisSettings');
        return saved ? JSON.parse(saved) : { ...this.defaults };
    }

    saveSettings() {
        localStorage.setItem('tetrisSettings', JSON.stringify(this.settings));
    }

    getSetting(key) {
        return this.settings[key] ?? this.defaults[key];
    }

    setSetting(key, value) {
        this.settings[key] = value;
        this.saveSettings();
    }

    resetToDefaults() {
        this.settings = { ...this.defaults };
        this.saveSettings();
    }

    getControlScheme() {
        const schemes = {
            standard: {
                left: ['a', 'ArrowLeft'],
                right: ['d', 'ArrowRight'],
                down: ['s', 'ArrowDown'],
                rotate: ['w', 'ArrowUp'],
                hardDrop: [' '],
                pause: ['p']
            },
            dvorak: {
                left: ['o', 'ArrowLeft'],
                right: ['e', 'ArrowRight'],
                down: ['u', 'ArrowDown'],
                rotate: ['comma', 'ArrowUp'],
                hardDrop: [' '],
                pause: ['semicolon']
            }
        };
        return schemes[this.getSetting('controlScheme')] || schemes.standard;
    }

    createSettingsUI() {
        return `
            <div style="border: 1px solid #ccc; padding: 20px; max-width: 400px;">
                <h2>⚙️ Game Settings</h2>
                
                <label style="display: block; margin: 10px 0;">
                    <input type="checkbox" 
                           ${this.getSetting('ghostPiece') ? 'checked' : ''} 
                           onchange="gameSettings.setSetting('ghostPiece', this.checked)">
                    Ghost Piece
                </label>

                <label style="display: block; margin: 10px 0;">
                    <input type="checkbox" 
                           ${this.getSetting('soundEffects') ? 'checked' : ''} 
                           onchange="gameSettings.setSetting('soundEffects', this.checked)">
                    Sound Effects
                </label>

                <label style="display: block; margin: 10px 0;">
                    Volume: 
                    <input type="range" min="0" max="1" step="0.1" 
                           value="${this.getSetting('volume')}"
                           onchange="gameSettings.setSetting('volume', parseFloat(this.value))">
                </label>

                <label style="display: block; margin: 10px 0;">
                    Difficulty:
                    <select onchange="gameSettings.setSetting('difficulty', this.value)">
                        <option value="easy" ${this.getSetting('difficulty') === 'easy' ? 'selected' : ''}>Easy</option>
                        <option value="normal" ${this.getSetting('difficulty') === 'normal' ? 'selected' : ''}>Normal</option>
                        <option value="hard" ${this.getSetting('difficulty') === 'hard' ? 'selected' : ''}>Hard</option>
                        <option value="insane" ${this.getSetting('difficulty') === 'insane' ? 'selected' : ''}>Insane</option>
                    </select>
                </label>

                <button onclick="gameSettings.resetToDefaults()" 
                        style="padding: 10px 20px; margin-top: 20px; cursor: pointer;">
                    Reset to Defaults
                </button>
            </div>
        `;
    }
}

// Penggunaan:
// const gameSettings = new GameSettings();
// gameSettings.setSetting('difficulty', 'hard');
// document.body.innerHTML += gameSettings.createSettingsUI();


// ========================================
// 3. STATISTICS & ANALYTICS
// ========================================

/**
 * Contoh 3.1: Game statistics tracker
 * ====================================
 */

class GameStatistics {
    constructor() {
        this.stats = this.loadStats();
    }

    loadStats() {
        const saved = localStorage.getItem('tetrisStats');
        return saved ? JSON.parse(saved) : {
            totalGames: 0,
            totalScore: 0,
            bestScore: 0,
            totalLinesCleared: 0,
            highestLevel: 1,
            totalPlayTime: 0, // in seconds
            gameHistory: []
        };
    }

    saveStats() {
        localStorage.setItem('tetrisStats', JSON.stringify(this.stats));
    }

    recordGame(score, level, lines, duration) {
        this.stats.totalGames += 1;
        this.stats.totalScore += score;
        this.stats.bestScore = Math.max(this.stats.bestScore, score);
        this.stats.totalLinesCleared += lines;
        this.stats.highestLevel = Math.max(this.stats.highestLevel, level);
        this.stats.totalPlayTime += duration;

        this.stats.gameHistory.push({
            date: new Date().toISOString(),
            score: score,
            level: level,
            lines: lines,
            duration: duration
        });

        this.saveStats();
    }

    getAverageScore() {
        return this.stats.totalGames > 0 
            ? Math.round(this.stats.totalScore / this.stats.totalGames) 
            : 0;
    }

    getAverageLevel() {
        return this.stats.totalGames > 0 
            ? (this.stats.gameHistory.reduce((a, g) => a + g.level, 0) / this.stats.totalGames).toFixed(1)
            : 0;
    }

    getTotalPlayTimeFormatted() {
        const hours = Math.floor(this.stats.totalPlayTime / 3600);
        const minutes = Math.floor((this.stats.totalPlayTime % 3600) / 60);
        return `${hours}h ${minutes}m`;
    }

    createStatsUI() {
        return `
            <div style="border: 1px solid #ccc; padding: 20px; max-width: 400px;">
                <h2>📊 Game Statistics</h2>
                <p>Total Games: ${this.stats.totalGames}</p>
                <p>Best Score: ${this.stats.bestScore}</p>
                <p>Average Score: ${this.getAverageScore()}</p>
                <p>Average Level: ${this.getAverageLevel()}</p>
                <p>Total Lines: ${this.stats.totalLinesCleared}</p>
                <p>Highest Level: ${this.stats.highestLevel}</p>
                <p>Play Time: ${this.getTotalPlayTimeFormatted()}</p>
            </div>
        `;
    }

    resetStats() {
        this.stats = {
            totalGames: 0,
            totalScore: 0,
            bestScore: 0,
            totalLinesCleared: 0,
            highestLevel: 1,
            totalPlayTime: 0,
            gameHistory: []
        };
        this.saveStats();
    }
}

// Penggunaan:
// const stats = new GameStatistics();
// stats.recordGame(5000, 15, 50, 300);
// document.body.innerHTML += stats.createStatsUI();


// ========================================
// 4. INTEGRATION CHECKLIST
// ========================================

const INTEGRATION_CHECKLIST = {
    'Basic Setup': [
        '✅ Download tetris-game.html',
        '✅ Open in modern browser',
        '✅ Game runs without errors'
    ],
    
    'Advanced Integration': [
        '⚡ Add to existing website via iframe',
        '⚡ Implement data tracking',
        '⚡ Connect to backend API',
        '⚡ Add leaderboard system'
    ],

    'Customization': [
        '🎨 Change colors/theme',
        '🎨 Add custom tetrominos',
        '🎨 Adjust difficulty levels',
        '🎨 Modify control schemes'
    ],

    'Features': [
        '🎵 Add sound effects',
        '⚙️ Add settings panel',
        '📊 Track statistics',
        '🏆 Implement leaderboard'
    ]
};

console.log('Tetris Game Integration Ready!');
console.log('Available Classes:');
console.log('- GameDataTracker');
console.log('- LeaderboardManager');
console.log('- CustomTetrisGame');
console.log('- GameSoundManager');
console.log('- GameSettings');
console.log('- GameStatistics');
