/**
 * ===================================================
 * TETRIS GAME - MODULAR JAVASCRIPT VERSION
 * ===================================================
 * 
 * Struktur:
 * 1. Game State Management
 * 2. Tetromino Definitions
 * 3. Board Operations
 * 4. Piece Movement
 * 5. Collision Detection
 * 6. Rendering
 * 7. Game Logic
 * 8. Event Handlers
 */

// ===== 1. GAME STATE MANAGEMENT =====
class GameState {
    constructor() {
        this.ROWS = 20;
        this.COLS = 10;
        this.board = this.initBoard();
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.gameRunning = false;
        this.gamePaused = false;
        this.dropSpeed = 800;
        this.highScore = parseInt(localStorage.getItem('tetrisHighScore')) || 0;
        
        this.currentPiece = null;
        this.nextPiece = null;
        this.pieceX = 0;
        this.pieceY = 0;
        this.dropInterval = null;
    }

    initBoard() {
        return Array(this.ROWS).fill(null).map(() => Array(this.COLS).fill(0));
    }

    reset() {
        this.board = this.initBoard();
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.dropSpeed = 800;
        this.gameRunning = true;
        this.gamePaused = false;
    }

    updateHighScore() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('tetrisHighScore', this.highScore);
        }
    }

    increaseLevel() {
        this.level = Math.floor(this.lines / 10) + 1;
        this.dropSpeed = Math.max(100, 800 - (this.level - 1) * 50);
    }
}

// ===== 2. TETROMINO DEFINITIONS =====
const TETROMINOS = {
    I: {
        shape: [[1, 1, 1, 1]],
        color: '#00f0f0',
        name: 'I'
    },
    O: {
        shape: [[1, 1], [1, 1]],
        color: '#f0f000',
        name: 'O'
    },
    T: {
        shape: [[0, 1, 0], [1, 1, 1]],
        color: '#a000f0',
        name: 'T'
    },
    S: {
        shape: [[0, 1, 1], [1, 1, 0]],
        color: '#00f000',
        name: 'S'
    },
    Z: {
        shape: [[1, 1, 0], [0, 1, 1]],
        color: '#f00000',
        name: 'Z'
    },
    J: {
        shape: [[1, 0, 0], [1, 1, 1]],
        color: '#0000f0',
        name: 'J'
    },
    L: {
        shape: [[0, 0, 1], [1, 1, 1]],
        color: '#f0a000',
        name: 'L'
    }
};

const TETROMINO_KEYS = Object.keys(TETROMINOS);

// ===== 3. BOARD OPERATIONS =====
class BoardManager {
    constructor(state) {
        this.state = state;
    }

    getPieceAt(row, col) {
        if (row >= 0 && row < this.state.ROWS && col >= 0 && col < this.state.COLS) {
            return this.state.board[row][col];
        }
        return null;
    }

    setPieceAt(row, col, value) {
        if (row >= 0 && row < this.state.ROWS && col >= 0 && col < this.state.COLS) {
            this.state.board[row][col] = value;
        }
    }

    isRowFull(row) {
        return this.state.board[row].every(cell => cell !== 0);
    }

    clearRow(row) {
        this.state.board.splice(row, 1);
        this.state.board.unshift(Array(this.state.COLS).fill(0));
    }

    clearCompleteRows() {
        let linesCleared = 0;
        for (let r = this.state.ROWS - 1; r >= 0; r--) {
            if (this.isRowFull(r)) {
                this.clearRow(r);
                linesCleared++;
                r++;
            }
        }
        return linesCleared;
    }
}

// ===== 4. PIECE MOVEMENT =====
class PieceGenerator {
    static createRandomPiece() {
        const key = TETROMINO_KEYS[Math.floor(Math.random() * TETROMINO_KEYS.length)];
        const template = TETROMINOS[key];
        return {
            shape: JSON.parse(JSON.stringify(template.shape)),
            color: template.color,
            name: template.name
        };
    }
}

class PieceManager {
    constructor(state, boardManager) {
        this.state = state;
        this.boardManager = boardManager;
    }

    getShapeCell(piece, row, col) {
        if (row < 0 || row >= piece.shape.length || col < 0 || col >= piece.shape[row].length) {
            return 0;
        }
        return piece.shape[row][col];
    }

    rotatePiece(piece) {
        const original = JSON.parse(JSON.stringify(piece.shape));
        const n = piece.shape.length;
        const m = piece.shape[0].length;

        // Transpose dan reverse untuk rotasi clockwise
        const newShape = piece.shape[0].map((_, colIndex) =>
            piece.shape.map(row => row[colIndex]).reverse()
        );

        piece.shape = newShape;
        return original;
    }
}

// ===== 5. COLLISION DETECTION =====
class CollisionDetector {
    constructor(state, boardManager) {
        this.state = state;
        this.boardManager = boardManager;
    }

    canMovePiece(piece, dx, dy) {
        if (!piece) return false;

        const shape = piece.shape;
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    const newX = this.state.pieceX + x + dx;
                    const newY = this.state.pieceY + y + dy;

                    // Check boundaries
                    if (newX < 0 || newX >= this.state.COLS || newY >= this.state.ROWS) {
                        return false;
                    }

                    // Check collision with placed pieces
                    if (newY >= 0 && this.boardManager.getPieceAt(newY, newX)) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    canPlacePiece() {
        return this.canMovePiece(this.state.currentPiece, 0, 0);
    }
}

// ===== 6. RENDERER =====
class GameRenderer {
    constructor(state, boardManager) {
        this.state = state;
        this.boardManager = boardManager;
        this.gridElement = document.getElementById('gameGrid');
        this.previewElement = document.getElementById('previewGrid');
    }

    renderBoard() {
        this.gridElement.innerHTML = '';

        for (let r = 0; r < this.state.ROWS; r++) {
            for (let c = 0; c < this.state.COLS; c++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';

                const color = this.boardManager.getPieceAt(r, c);
                if (color) {
                    cell.style.background = color;
                    cell.classList.add('filled');
                }

                this.gridElement.appendChild(cell);
            }
        }
    }

    renderCurrentPiece() {
        if (!this.state.currentPiece) return;

        const shape = this.state.currentPiece.shape;
        const color = this.state.currentPiece.color;

        shape.forEach((row, y) => {
            row.forEach((val, x) => {
                if (val) {
                    const r = this.state.pieceY + y;
                    const c = this.state.pieceX + x;

                    if (r >= 0 && r < this.state.ROWS && c >= 0 && c < this.state.COLS) {
                        const idx = r * this.state.COLS + c;
                        const element = this.gridElement.children[idx];
                        if (element) {
                            element.style.background = color;
                            element.classList.add('filled');
                        }
                    }
                }
            });
        });
    }

    renderGame() {
        this.renderBoard();
        this.renderCurrentPiece();
    }

    renderPreview() {
        this.previewElement.innerHTML = '';

        if (!this.state.nextPiece) return;

        const previewCells = Array(16).fill(0);

        this.state.nextPiece.shape.forEach((row, y) => {
            row.forEach((val, x) => {
                if (val) {
                    const idx = y * 4 + x;
                    if (idx < 16) {
                        previewCells[idx] = this.state.nextPiece.color;
                    }
                }
            });
        });

        previewCells.forEach(color => {
            const cell = document.createElement('div');
            cell.className = 'preview-cell';
            if (color) cell.style.background = color;
            this.previewElement.appendChild(cell);
        });
    }

    updateUIDisplay() {
        document.getElementById('score').textContent = this.state.score;
        document.getElementById('level').textContent = this.state.level;
        document.getElementById('lines').textContent = this.state.lines;
        document.getElementById('highScore').textContent = this.state.highScore;

        const statusText = this.state.gamePaused ? 'Pause' : 'Bermain';
        document.getElementById('status').textContent = statusText;

        let speedText;
        if (this.state.level <= 3) speedText = 'Normal';
        else if (this.state.level <= 6) speedText = 'Cepat';
        else speedText = 'Sangat Cepat';
        document.getElementById('speed').textContent = speedText;

        this.renderPreview();
    }
}

// ===== 7. GAME LOGIC =====
class TetrisGame {
    constructor() {
        this.state = new GameState();
        this.boardManager = new BoardManager(this.state);
        this.pieceManager = new PieceManager(this.state, this.boardManager);
        this.collisionDetector = new CollisionDetector(this.state, this.boardManager);
        this.renderer = new GameRenderer(this.state, this.boardManager);
    }

    init() {
        this.state.reset();
        this.state.currentPiece = PieceGenerator.createRandomPiece();
        this.state.nextPiece = PieceGenerator.createRandomPiece();
        this.state.pieceX = 3;
        this.state.pieceY = 0;

        this.renderer.updateUIDisplay();
        this.renderer.renderGame();
        this.startGameLoop();
    }

    startGameLoop() {
        if (this.state.dropInterval) clearInterval(this.state.dropInterval);
        this.state.dropInterval = setInterval(() => {
            if (!this.state.gamePaused && this.state.gameRunning) {
                this.movePieceDown();
            }
        }, this.state.dropSpeed);
    }

    movePieceLeft() {
        if (!this.state.gameRunning || this.state.gamePaused) return;
        if (this.collisionDetector.canMovePiece(this.state.currentPiece, -1, 0)) {
            this.state.pieceX--;
        }
        this.renderer.renderGame();
    }

    movePieceRight() {
        if (!this.state.gameRunning || this.state.gamePaused) return;
        if (this.collisionDetector.canMovePiece(this.state.currentPiece, 1, 0)) {
            this.state.pieceX++;
        }
        this.renderer.renderGame();
    }

    movePieceDown() {
        if (!this.state.gameRunning) return;

        if (this.collisionDetector.canMovePiece(this.state.currentPiece, 0, 1)) {
            this.state.pieceY++;
            this.renderer.renderGame();
        } else {
            this.placePiece();
        }
    }

    hardDrop() {
        if (!this.state.gameRunning || this.state.gamePaused) return;

        while (this.collisionDetector.canMovePiece(this.state.currentPiece, 0, 1)) {
            this.state.pieceY++;
        }
        this.placePiece();
    }

    rotatePiece() {
        if (!this.state.gameRunning || this.state.gamePaused) return;

        const original = this.pieceManager.rotatePiece(this.state.currentPiece);

        if (!this.collisionDetector.canMovePiece(this.state.currentPiece, 0, 0)) {
            this.state.currentPiece.shape = original;
        }
        this.renderer.renderGame();
    }

    placePiece() {
        const shape = this.state.currentPiece.shape;
        const color = this.state.currentPiece.color;

        // Place piece on board
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    const r = this.state.pieceY + y;
                    const c = this.state.pieceX + x;
                    if (r >= 0) {
                        this.boardManager.setPieceAt(r, c, color);
                    }
                }
            }
        }

        // Check and clear complete rows
        this.clearCompleteLines();

        // Next piece
        this.state.currentPiece = this.state.nextPiece;
        this.state.nextPiece = PieceGenerator.createRandomPiece();
        this.state.pieceX = 3;
        this.state.pieceY = 0;

        // Check if new piece can be placed
        if (!this.collisionDetector.canPlacePiece()) {
            this.endGame();
        } else {
            this.renderer.updateUIDisplay();
            this.renderer.renderGame();
        }
    }

    clearCompleteLines() {
        const linesCleared = this.boardManager.clearCompleteRows();

        if (linesCleared > 0) {
            this.state.lines += linesCleared;

            // Scoring
            const pointsTable = {
                1: 100,
                2: 300,
                3: 500,
                4: 800
            };
            this.state.score += pointsTable[linesCleared] || 0;

            // Update level and speed
            this.state.increaseLevel();
            this.startGameLoop();
        }
    }

    togglePause() {
        if (this.state.gameRunning) {
            this.state.gamePaused = !this.state.gamePaused;
            this.renderer.updateUIDisplay();
        }
    }

    endGame() {
        this.state.gameRunning = false;
        clearInterval(this.state.dropInterval);

        this.state.updateHighScore();
        document.getElementById('finalScore').textContent = this.state.score;
        document.getElementById('gameOverModal').classList.add('show');
    }
}

// ===== 8. EVENT HANDLERS =====
let game = null;

function initializeGame() {
    game = new TetrisGame();
    game.init();
}

function setupEventListeners() {
    document.getElementById('playBtn').addEventListener('click', () => {
        if (!game) {
            initializeGame();
        } else if (!game.state.gameRunning) {
            game.init();
        } else {
            game.state.gamePaused = false;
            game.renderer.updateUIDisplay();
            game.renderer.renderGame();
            game.startGameLoop();
        }
    });

    document.getElementById('pauseBtn').addEventListener('click', () => {
        if (game && game.state.gameRunning) {
            game.togglePause();
        }
    });

    document.getElementById('leftBtn').addEventListener('click', () => {
        if (game) game.movePieceLeft();
    });

    document.getElementById('rightBtn').addEventListener('click', () => {
        if (game) game.movePieceRight();
    });

    document.getElementById('downBtn').addEventListener('click', () => {
        if (game) game.movePieceDown();
    });

    document.getElementById('rotateBtn').addEventListener('click', () => {
        if (game) game.rotatePiece();
    });

    document.getElementById('hardDropBtn').addEventListener('click', () => {
        if (game) game.hardDrop();
    });

    document.getElementById('restartBtn').addEventListener('click', () => {
        document.getElementById('gameOverModal').classList.remove('show');
        initializeGame();
    });

    document.getElementById('closeBtn').addEventListener('click', () => {
        document.getElementById('gameOverModal').classList.remove('show');
    });

    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        if (!game || !game.state.gameRunning) return;

        switch (e.key.toLowerCase()) {
            case 'a':
            case 'arrowleft':
                game.movePieceLeft();
                e.preventDefault();
                break;
            case 'd':
            case 'arrowright':
                game.movePieceRight();
                e.preventDefault();
                break;
            case 's':
            case 'arrowdown':
                game.movePieceDown();
                e.preventDefault();
                break;
            case 'w':
            case 'arrowup':
                game.rotatePiece();
                e.preventDefault();
                break;
            case ' ':
                game.hardDrop();
                e.preventDefault();
                break;
            case 'p':
                document.getElementById('pauseBtn').click();
                e.preventDefault();
                break;
        }
    });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', setupEventListeners);
