export interface HighScoreEntry {
	name: string;
	score: number;
	mode: string;
	difficulty: string;
	date: string;
}

export interface GameSettings {
	musicOn: boolean;
	sfxOn: boolean;
	difficulty: 'easy' | 'medium' | 'hard';
	musicVolume: number;
	sfxVolume: number;
}

const STORAGE_KEYS = {
	HIGH_SCORES: 'number-munchers-high-scores',
	SETTINGS: 'number-munchers-settings'
} as const;

const DEFAULT_SETTINGS: GameSettings = {
	musicOn: true,
	sfxOn: true,
	difficulty: 'medium',
	musicVolume: 0.3,
	sfxVolume: 0.7
};

function load<T>(key: string, fallback: T): T {
	try {
		const raw = localStorage.getItem(key);
		if (raw === null) return fallback;
		return JSON.parse(raw) as T;
	} catch {
		return fallback;
	}
}

function save<T>(key: string, value: T): void {
	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch {
		// localStorage full or unavailable - silently fail
	}
}

export function loadSettings(): GameSettings {
	return { ...DEFAULT_SETTINGS, ...load<Partial<GameSettings>>(STORAGE_KEYS.SETTINGS, {}) };
}

export function saveSettings(settings: GameSettings): void {
	save(STORAGE_KEYS.SETTINGS, settings);
}

export function loadHighScores(): HighScoreEntry[] {
	return load<HighScoreEntry[]>(STORAGE_KEYS.HIGH_SCORES, []);
}

export function saveHighScores(scores: HighScoreEntry[]): void {
	save(STORAGE_KEYS.HIGH_SCORES, scores);
}

export function addHighScore(entry: HighScoreEntry): HighScoreEntry[] {
	const scores = loadHighScores();
	scores.push(entry);
	scores.sort((a, b) => b.score - a.score);
	const top = scores.slice(0, 50); // keep top 50 across all modes
	saveHighScores(top);
	return top;
}

export function getHighScoresForMode(mode: string): HighScoreEntry[] {
	return loadHighScores()
		.filter((s) => s.mode === mode)
		.slice(0, 10);
}

export function isHighScore(score: number, mode: string): boolean {
	const modeScores = getHighScoresForMode(mode);
	return modeScores.length < 10 || score > (modeScores[modeScores.length - 1]?.score ?? 0);
}

export function clearHighScores(): void {
	save(STORAGE_KEYS.HIGH_SCORES, []);
}
