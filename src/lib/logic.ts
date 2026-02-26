export type GameMode = 'multiples' | 'factors' | 'primes' | 'equality' | 'inequality' | 'challenge';
export type Difficulty = 'easy' | 'medium' | 'hard';

export function isPrime(n: number): boolean {
	if (n < 2) return false;
	if (n === 2) return true;
	if (n % 2 === 0) return false;
	for (let i = 3; i * i <= n; i += 2) {
		if (n % i === 0) return false;
	}
	return true;
}

export function evaluateExpression(expr: string): number | null {
	// Parse simple "A op B" expressions
	const match = expr.match(/^(\d+)\s*([+\-×÷xX*\/])\s*(\d+)$/);
	if (!match) return null;

	const a = parseInt(match[1], 10);
	const op = match[2];
	const b = parseInt(match[3], 10);

	switch (op) {
		case '+':
			return a + b;
		case '-':
			return a - b;
		case '×':
		case 'x':
		case 'X':
		case '*':
			return a * b;
		case '÷':
		case '/':
			return b === 0 ? null : a / b;
		default:
			return null;
	}
}

export function isCorrect(mode: GameMode, target: number, cellValue: string | number): boolean {
	if (mode === 'primes') {
		const num = typeof cellValue === 'string' ? parseInt(cellValue, 10) : cellValue;
		return isPrime(num);
	}

	if (mode === 'multiples') {
		const num = typeof cellValue === 'string' ? parseInt(cellValue, 10) : cellValue;
		return num !== 0 && num % target === 0;
	}

	if (mode === 'factors') {
		const num = typeof cellValue === 'string' ? parseInt(cellValue, 10) : cellValue;
		return num > 0 && target % num === 0;
	}

	if (mode === 'equality') {
		if (typeof cellValue === 'string') {
			const result = evaluateExpression(cellValue);
			return result !== null && result === target;
		}
		return cellValue === target;
	}

	if (mode === 'inequality') {
		if (typeof cellValue === 'string') {
			const result = evaluateExpression(cellValue);
			return result !== null && result !== target;
		}
		return cellValue !== target;
	}

	return false;
}

// Difficulty-based number ranges
export interface DifficultyConfig {
	multiplesRange: [number, number]; // min, max for the multiplier
	multiplesNumberRange: [number, number]; // range of numbers on board
	factorsRange: [number, number]; // range of the number to find factors of
	primesRange: [number, number]; // range of numbers on board
	equalityTargetRange: [number, number]; // target value range
	equalityOps: string[]; // available operations
	equalityOperandMax: number; // max operand value
}

export const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
	easy: {
		multiplesRange: [2, 5],
		multiplesNumberRange: [1, 50],
		factorsRange: [6, 24],
		primesRange: [1, 50],
		equalityTargetRange: [2, 10],
		equalityOps: ['+', '-'],
		equalityOperandMax: 10
	},
	medium: {
		multiplesRange: [3, 12],
		multiplesNumberRange: [1, 200],
		factorsRange: [12, 60],
		primesRange: [1, 200],
		equalityTargetRange: [5, 25],
		equalityOps: ['+', '-', '×'],
		equalityOperandMax: 15
	},
	hard: {
		multiplesRange: [7, 25],
		multiplesNumberRange: [1, 999],
		factorsRange: [24, 120],
		primesRange: [1, 999],
		equalityTargetRange: [10, 50],
		equalityOps: ['+', '-', '×', '÷'],
		equalityOperandMax: 25
	}
};

export function getRandomInt(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateChallenge(
	mode: GameMode,
	difficulty: Difficulty,
	level: number
): { text: string; target: number; actualMode: GameMode } {
	const config = DIFFICULTY_CONFIGS[difficulty];
	let actualMode = mode;

	if (mode === 'challenge') {
		const modes: GameMode[] = ['multiples', 'factors', 'primes', 'equality', 'inequality'];
		actualMode = modes[level % modes.length];
	}

	let target: number;
	let text: string;

	switch (actualMode) {
		case 'multiples': {
			// Scale target with level progression
			const minMult = config.multiplesRange[0];
			const maxMult = Math.min(
				config.multiplesRange[1] + Math.floor(level / 3),
				config.multiplesRange[1] * 2
			);
			target = getRandomInt(minMult, maxMult);
			text = `Multiples of ${target}`;
			break;
		}
		case 'factors': {
			const minFact = config.factorsRange[0];
			const maxFact = Math.min(config.factorsRange[1] + level * 5, config.factorsRange[1] * 2);
			target = getRandomInt(minFact, maxFact);
			text = `Factors of ${target}`;
			break;
		}
		case 'primes': {
			target = 0; // not used for primes
			text = 'Primes';
			break;
		}
		case 'equality': {
			const minEq = config.equalityTargetRange[0];
			const maxEq = Math.min(
				config.equalityTargetRange[1] + Math.floor(level / 2),
				config.equalityTargetRange[1] * 2
			);
			target = getRandomInt(minEq, maxEq);
			text = `Equals ${target}`;
			break;
		}
		case 'inequality': {
			const minIneq = config.equalityTargetRange[0];
			const maxIneq = Math.min(
				config.equalityTargetRange[1] + Math.floor(level / 2),
				config.equalityTargetRange[1] * 2
			);
			target = getRandomInt(minIneq, maxIneq);
			text = `Not Equal to ${target}`;
			break;
		}
		default:
			target = 5;
			text = 'Multiples of 5';
			actualMode = 'multiples';
	}

	return { text, target, actualMode };
}
