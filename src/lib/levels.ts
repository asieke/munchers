import type { Difficulty, GameMode } from './logic';

export type TroggleType = 'reggie' | 'bashful' | 'helper' | 'worker' | 'smartie';

export interface LevelConfig {
	troggleCount: number;
	troggleTypes: TroggleType[];
	troggleMoveInterval: number; // ms between troggle moves
	boardsToComplete: number; // boards to clear to beat the level
	pointsPerCorrect: number;
}

export function getLevelConfig(level: number, difficulty: Difficulty): LevelConfig {
	const difficultyMultiplier = difficulty === 'easy' ? 0.7 : difficulty === 'hard' ? 1.5 : 1;
	const levelOffset = difficulty === 'easy' ? 2 : difficulty === 'hard' ? -2 : 0;
	const adjustedLevel = Math.max(1, level + levelOffset);

	// Troggle count scales with level
	let troggleCount: number;
	if (adjustedLevel <= 3) troggleCount = 1;
	else if (adjustedLevel <= 7) troggleCount = 2;
	else troggleCount = 3;

	// For easy mode, start troggles later
	if (difficulty === 'easy' && level <= 2) troggleCount = 0;
	if (difficulty === 'easy') troggleCount = Math.max(0, troggleCount - 1);

	// Available troggle types expand with level
	const troggleTypes: TroggleType[] = ['reggie'];
	if (adjustedLevel >= 4) troggleTypes.push('bashful');
	if (adjustedLevel >= 8) troggleTypes.push('helper');
	if (adjustedLevel >= 12) troggleTypes.push('worker');
	if (adjustedLevel >= 16) troggleTypes.push('smartie');

	// Troggle speed: starts slow, gets faster
	const baseMoveInterval = 1500;
	const speedup = Math.min(adjustedLevel * 50, 1000);
	const troggleMoveInterval = Math.max(400, baseMoveInterval - speedup);

	// Boards to complete per level
	const boardsToComplete = difficulty === 'easy' ? 1 : difficulty === 'hard' ? 3 : 2;

	// Points per correct munch
	const basePoints = 5;
	const pointsPerCorrect = Math.round(basePoints * level * difficultyMultiplier);

	return {
		troggleCount,
		troggleTypes,
		troggleMoveInterval,
		boardsToComplete,
		pointsPerCorrect
	};
}

export function getExtraLifeThreshold(difficulty: Difficulty): number {
	switch (difficulty) {
		case 'easy':
			return 200;
		case 'medium':
			return 500;
		case 'hard':
			return 1000;
	}
}

// Returns the sequence of modes for challenge mode
export function getChallengeMode(level: number): GameMode {
	const modes: GameMode[] = ['multiples', 'factors', 'primes', 'equality', 'inequality'];
	return modes[(level - 1) % modes.length];
}
