import {
	type GameMode,
	type Difficulty,
	generateChallenge,
	isCorrect,
	getRandomInt
} from './logic';
import {
	generateBoard,
	generateIncorrectValue,
	countRemainingCorrect,
	BOARD_ROWS,
	BOARD_COLS,
	type CellValue
} from './board';
import {
	getLevelConfig,
	getExtraLifeThreshold,
	type TroggleType,
	type LevelConfig
} from './levels';
import { moveTroggle, spawnTroggle, type TroggleState } from './troggle-ai';
import {
	playMunchCorrect,
	playMunchWrong,
	playMove,
	playTroggleCatch,
	playTroggleEnter,
	playLevelComplete,
	playGameOver,
	playExtraLife,
	startMusic,
	stopMusic,
	initAudio,
	setMusicOn,
	setSfxOn,
	setMusicVolume,
	setSfxVolume
} from './audio';
import { loadSettings, saveSettings, type GameSettings } from './storage';

export type Screen =
	| 'title'
	| 'modeSelect'
	| 'playing'
	| 'paused'
	| 'levelComplete'
	| 'gameOver'
	| 'highScores'
	| 'enterInitials';

export interface MuncherState {
	row: number;
	col: number;
	prevRow: number;
	prevCol: number;
	moveProgress: number;
	isMoving: boolean;
	isEating: boolean;
	isDying: boolean;
	isInvincible: boolean;
	facing: 'up' | 'down' | 'left' | 'right';
	animFrame: number;
}

// Global game state using Svelte 5 runes
let screen = $state<Screen>('title');
let difficulty = $state<Difficulty>('medium');
let gameMode = $state<GameMode>('multiples');
let actualMode = $state<GameMode>('multiples');
let level = $state(1);
let score = $state(0);
let lives = $state(3);
let challengeText = $state('');
let challengeTarget = $state(0);
let boardCells = $state<CellValue[][]>([]);
let eatenCells = $state<boolean[][]>([]);
let boardsCleared = $state(0);
let levelConfig = $state<LevelConfig | null>(null);
let nextExtraLife = $state(0);

let muncher = $state<MuncherState>({
	row: 2,
	col: 2,
	prevRow: 2,
	prevCol: 2,
	moveProgress: 1,
	isMoving: false,
	isEating: false,
	isDying: false,
	isInvincible: false,
	facing: 'right',
	animFrame: 0
});

let troggles = $state<TroggleState[]>([]);
let safetyCells = $state<Set<string>>(new Set());
let troggleIdCounter = $state(0);
let settings = $state<GameSettings>(loadSettings());
let isPaused = $state(false);
let shakeScreen = $state(false);
let flashCorrect = $state(false);
let moveBuffer = $state<'up' | 'down' | 'left' | 'right' | null>(null);

// Troggle movement timers
let troggleMoveTimers: number[] = [];
let safetySquareTimer: number | null = null;
let invincibilityTimer: number | null = null;
let pendingTimeouts: number[] = [];

/** Schedule a setTimeout that is automatically tracked and cleared on screen transitions. */
function trackedTimeout(callback: () => void, delay: number): number {
	const id = window.setTimeout(() => {
		// Remove from tracking list once it fires
		pendingTimeouts = pendingTimeouts.filter((t) => t !== id);
		callback();
	}, delay);
	pendingTimeouts.push(id);
	return id;
}

function clearPendingTimeouts(): void {
	pendingTimeouts.forEach((t) => clearTimeout(t));
	pendingTimeouts = [];
}

// --- Exported accessors ---

export function getState() {
	return {
		get screen() {
			return screen;
		},
		get difficulty() {
			return difficulty;
		},
		get gameMode() {
			return gameMode;
		},
		get actualMode() {
			return actualMode;
		},
		get level() {
			return level;
		},
		get score() {
			return score;
		},
		get lives() {
			return lives;
		},
		get challengeText() {
			return challengeText;
		},
		get challengeTarget() {
			return challengeTarget;
		},
		get boardCells() {
			return boardCells;
		},
		get eatenCells() {
			return eatenCells;
		},
		get boardsCleared() {
			return boardsCleared;
		},
		get levelConfig() {
			return levelConfig;
		},
		get muncher() {
			return muncher;
		},
		get troggles() {
			return troggles;
		},
		get safetyCells() {
			return safetyCells;
		},
		get settings() {
			return settings;
		},
		get isPaused() {
			return isPaused;
		},
		get shakeScreen() {
			return shakeScreen;
		},
		get flashCorrect() {
			return flashCorrect;
		},
		get moveBuffer() {
			return moveBuffer;
		}
	};
}

// --- Actions ---

export function setScreen(s: Screen): void {
	screen = s;
}

export function setDifficulty(d: Difficulty): void {
	difficulty = d;
	settings.difficulty = d;
	saveSettings(settings);
}

export function setGameMode(mode: GameMode): void {
	gameMode = mode;
}

export function togglePause(): void {
	if (screen === 'playing') {
		isPaused = !isPaused;
	}
}

export function toggleMusic(): void {
	settings.musicOn = !settings.musicOn;
	setMusicOn(settings.musicOn);
	saveSettings(settings);
}

export function toggleSfx(): void {
	settings.sfxOn = !settings.sfxOn;
	setSfxOn(settings.sfxOn);
	saveSettings(settings);
}

export function startGame(): void {
	initAudio();

	// Sync audio module with saved settings
	setMusicOn(settings.musicOn);
	setSfxOn(settings.sfxOn);
	setMusicVolume(settings.musicVolume);
	setSfxVolume(settings.sfxVolume);

	level = 1;
	score = 0;
	lives = 3;
	boardsCleared = 0;
	troggleIdCounter = 0;
	troggles = [];
	safetyCells = new Set();
	isPaused = false;

	nextExtraLife = getExtraLifeThreshold(difficulty);

	startLevel();
	startMusic();
	screen = 'playing';
}

function startLevel(): void {
	// Generate challenge
	const challenge = generateChallenge(gameMode, difficulty, level);
	challengeText = challenge.text;
	challengeTarget = challenge.target;
	actualMode = challenge.actualMode;

	// Get level config
	levelConfig = getLevelConfig(level, difficulty);

	// Generate board
	refreshBoard();

	// Reset muncher position
	muncher = {
		row: 2,
		col: 2,
		prevRow: 2,
		prevCol: 2,
		moveProgress: 1,
		isMoving: false,
		isEating: false,
		isDying: false,
		isInvincible: false,
		facing: 'right',
		animFrame: 0
	};

	// Clear old troggles and timers
	clearTroggleTimers();
	troggles = [];
	safetyCells = new Set();
	boardsCleared = 0;

	// Spawn troggles
	spawnTroggles();

	// Start troggle movement
	startTroggleMovement();

	// Start safety square spawning
	startSafetySquares();
}

function refreshBoard(): void {
	const board = generateBoard(actualMode, challengeTarget, difficulty);
	boardCells = board.cells;
	eatenCells = Array.from({ length: BOARD_ROWS }, () => Array(BOARD_COLS).fill(false));
}

function spawnTroggles(): void {
	if (!levelConfig) return;
	const existingPositions = [
		{ row: muncher.row, col: muncher.col },
		...troggles.map((t) => ({ row: t.row, col: t.col }))
	];

	while (troggles.length < levelConfig.troggleCount) {
		const typeIdx = Math.floor(Math.random() * levelConfig.troggleTypes.length);
		const type = levelConfig.troggleTypes[typeIdx];
		const newTroggle = spawnTroggle(troggleIdCounter++, type, existingPositions);
		troggles.push(newTroggle);
		existingPositions.push({ row: newTroggle.row, col: newTroggle.col });
		playTroggleEnter();
	}
}

function clearTroggleTimers(): void {
	troggleMoveTimers.forEach((t) => clearInterval(t));
	troggleMoveTimers = [];
	if (safetySquareTimer) {
		clearInterval(safetySquareTimer);
		safetySquareTimer = null;
	}
	if (invincibilityTimer) {
		clearTimeout(invincibilityTimer);
		invincibilityTimer = null;
	}
	clearPendingTimeouts();
}

function startTroggleMovement(): void {
	if (!levelConfig) return;
	const interval = levelConfig.troggleMoveInterval;

	const timer = window.setInterval(() => {
		if (isPaused || screen !== 'playing') return;
		if (muncher.isDying) return;

		for (const troggle of troggles) {
			if (!troggle.alive || troggle.isMoving) continue;

			const [newRow, newCol] = moveTroggle(troggle, muncher.row, muncher.col, safetyCells);

			troggle.prevRow = troggle.row;
			troggle.prevCol = troggle.col;
			troggle.row = newRow;
			troggle.col = newCol;
			troggle.isMoving = true;
			troggle.moveProgress = 0;

			// Handle special troggle effects
			handleTroggleEffect(troggle);

			// Check collision with muncher
			checkTroggleCollision(troggle);
		}
	}, interval);

	troggleMoveTimers.push(timer);
}

function handleTroggleEffect(troggle: TroggleState): void {
	if (troggle.type === 'helper') {
		// Helper eats the cell content
		if (!eatenCells[troggle.row][troggle.col]) {
			eatenCells[troggle.row][troggle.col] = true;
		}
	} else if (troggle.type === 'worker') {
		// Worker changes the cell value to a mode-appropriate incorrect value
		if (!eatenCells[troggle.row][troggle.col]) {
			const newVal = generateIncorrectValue(actualMode, challengeTarget, difficulty);
			boardCells[troggle.row][troggle.col] = newVal;
		}
	}

	// Check troggle-on-troggle collision (cannibalism)
	for (const other of troggles) {
		if (
			other.id !== troggle.id &&
			other.alive &&
			other.row === troggle.row &&
			other.col === troggle.col
		) {
			// One eats the other (random)
			if (Math.random() > 0.5) {
				other.alive = false;
			} else {
				troggle.alive = false;
			}
			break;
		}
	}

	// Clean up dead troggles and respawn
	const deadCount = troggles.filter((t) => !t.alive).length;
	troggles = troggles.filter((t) => t.alive);
	if (deadCount > 0 && levelConfig) {
		// Respawn after delay
		trackedTimeout(() => {
			if (screen === 'playing') spawnTroggles();
		}, 3000);
	}
}

function checkTroggleCollision(troggle: TroggleState): void {
	if (
		troggle.row === muncher.row &&
		troggle.col === muncher.col &&
		!muncher.isInvincible &&
		!muncher.isDying
	) {
		muncherDeath();
	}
}

function startSafetySquares(): void {
	safetySquareTimer = window.setInterval(() => {
		if (isPaused || screen !== 'playing') return;

		// Randomly add/remove safety squares
		if (safetyCells.size === 0 && Math.random() < 0.15) {
			const row = getRandomInt(0, BOARD_ROWS - 1);
			const col = getRandomInt(0, BOARD_COLS - 1);
			const key = `${row},${col}`;
			safetyCells = new Set(safetyCells).add(key);

			// Check if troggle is on this cell - kill it
			for (const t of troggles) {
				if (t.row === row && t.col === col) {
					t.alive = false;
				}
			}
			troggles = troggles.filter((t) => t.alive);

			// Remove after 3-5 seconds
			trackedTimeout(
				() => {
					const newSet = new Set(safetyCells);
					newSet.delete(key);
					safetyCells = newSet;
				},
				getRandomInt(3000, 5000)
			);
		}
	}, 5000);
}

export function moveMuncher(direction: 'up' | 'down' | 'left' | 'right'): void {
	if (screen !== 'playing' || isPaused || muncher.isDying) return;

	if (muncher.isMoving || muncher.isEating) {
		// Buffer the move
		moveBuffer = direction;
		return;
	}

	const deltas: Record<string, [number, number]> = {
		up: [-1, 0],
		down: [1, 0],
		left: [0, -1],
		right: [0, 1]
	};

	const [dr, dc] = deltas[direction];
	const newRow = muncher.row + dr;
	const newCol = muncher.col + dc;

	if (newRow < 0 || newRow >= BOARD_ROWS || newCol < 0 || newCol >= BOARD_COLS) {
		return; // Can't move off grid
	}

	playMove();

	muncher.prevRow = muncher.row;
	muncher.prevCol = muncher.col;
	muncher.row = newRow;
	muncher.col = newCol;
	muncher.facing = direction;
	muncher.isMoving = true;
	muncher.moveProgress = 0;

	// Check collision with troggles at new position
	for (const t of troggles) {
		if (t.row === newRow && t.col === newCol && !muncher.isInvincible) {
			muncherDeath();
			return;
		}
	}
}

export function completeMuncherMove(): void {
	muncher.isMoving = false;
	muncher.moveProgress = 1;

	// Process buffered move
	if (moveBuffer) {
		const buf = moveBuffer;
		moveBuffer = null;
		moveMuncher(buf);
	}
}

export function munchCell(): void {
	if (screen !== 'playing' || isPaused || muncher.isMoving || muncher.isEating || muncher.isDying)
		return;

	const row = muncher.row;
	const col = muncher.col;

	if (eatenCells[row][col]) return; // Already eaten

	muncher.isEating = true;

	const cellValue = boardCells[row][col];
	const correct = isCorrect(actualMode, challengeTarget, cellValue);

	if (correct) {
		playMunchCorrect();
		eatenCells[row][col] = true;
		flashCorrect = true;
		trackedTimeout(() => {
			flashCorrect = false;
		}, 200);

		// Add score
		const points = levelConfig?.pointsPerCorrect ?? 5;
		score += points;

		// Check extra life
		if (score >= nextExtraLife) {
			lives++;
			nextExtraLife += getExtraLifeThreshold(difficulty);
			playExtraLife();
		}

		// Check if board is cleared
		const remaining = countRemainingCorrect(boardCells, eatenCells, actualMode, challengeTarget);
		if (remaining === 0) {
			boardsCleared++;
			if (levelConfig && boardsCleared >= levelConfig.boardsToComplete) {
				// Level complete
				trackedTimeout(() => {
					muncher.isEating = false;
					completeLevel();
				}, 300);
				return;
			} else {
				// Refresh board (after eating animation completes)
				trackedTimeout(() => {
					muncher.isEating = false;
					refreshBoard();
				}, 500);
				return;
			}
		}
	} else {
		playMunchWrong();
		shakeScreen = true;
		trackedTimeout(() => {
			shakeScreen = false;
		}, 300);

		lives--;
		if (lives < 0) {
			trackedTimeout(() => {
				muncher.isEating = false;
				gameOver();
			}, 500);
			return;
		}
	}

	// End eating animation
	trackedTimeout(() => {
		muncher.isEating = false;
	}, 250);
}

function muncherDeath(): void {
	if (muncher.isDying || muncher.isInvincible) return;

	playTroggleCatch();
	muncher.isDying = true;
	lives--;

	if (lives < 0) {
		trackedTimeout(() => {
			gameOver();
		}, 1000);
		return;
	}

	// Respawn after death animation
	trackedTimeout(() => {
		muncher.row = 2;
		muncher.col = 2;
		muncher.prevRow = 2;
		muncher.prevCol = 2;
		muncher.isDying = false;
		muncher.isMoving = false;
		muncher.moveProgress = 1;
		muncher.isInvincible = true;

		// End invincibility after 2 seconds
		invincibilityTimer = window.setTimeout(() => {
			muncher.isInvincible = false;
		}, 2000);
	}, 800);
}

function completeLevel(): void {
	clearTroggleTimers();
	playLevelComplete();
	screen = 'levelComplete';

	trackedTimeout(() => {
		level++;
		startLevel();
		screen = 'playing';
	}, 2500);
}

function gameOver(): void {
	clearTroggleTimers();
	stopMusic();
	playGameOver();
	screen = 'gameOver';
}

export function returnToTitle(): void {
	clearTroggleTimers();
	stopMusic();
	screen = 'title';
	isPaused = false;
}

export function goToEnterInitials(): void {
	screen = 'enterInitials';
}

export function goToHighScores(): void {
	screen = 'highScores';
}

export function getScore(): number {
	return score;
}

export function getGameMode(): GameMode {
	return gameMode;
}

export function getDifficulty(): Difficulty {
	return difficulty;
}

export function cleanup(): void {
	clearTroggleTimers();
}
