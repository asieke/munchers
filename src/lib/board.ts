import {
	type GameMode,
	type Difficulty,
	DIFFICULTY_CONFIGS,
	getRandomInt,
	isPrime,
	isCorrect
} from './logic';

export const BOARD_ROWS = 5;
export const BOARD_COLS = 6;
export const MIN_CORRECT = 8;
export const MAX_CORRECT = 14;

export type CellValue = string | number;

export interface BoardData {
	cells: CellValue[][];
	correctCount: number;
}

function generateCorrectValue(mode: GameMode, target: number, difficulty: Difficulty): CellValue {
	const config = DIFFICULTY_CONFIGS[difficulty];

	switch (mode) {
		case 'multiples': {
			const maxMultiplier = Math.floor(config.multiplesNumberRange[1] / target);
			const multiplier = getRandomInt(1, Math.max(1, maxMultiplier));
			return target * multiplier;
		}
		case 'factors': {
			const factors: number[] = [];
			for (let i = 1; i <= target; i++) {
				if (target % i === 0) factors.push(i);
			}
			return factors[getRandomInt(0, factors.length - 1)];
		}
		case 'primes': {
			const primes: number[] = [];
			for (let i = 2; i <= config.primesRange[1]; i++) {
				if (isPrime(i)) primes.push(i);
			}
			return primes[getRandomInt(0, primes.length - 1)];
		}
		case 'equality': {
			return generateExpressionForTarget(target, config.equalityOps, config.equalityOperandMax);
		}
		case 'inequality': {
			// Generate an expression that does NOT equal target
			let expr: string | undefined;
			let attempts = 0;
			do {
				const wrongTarget = getRandomInt(Math.max(1, target - 10), target + 10);
				if (wrongTarget === target) continue;
				expr = generateExpressionForTarget(
					wrongTarget,
					config.equalityOps,
					config.equalityOperandMax
				);
				attempts++;
			} while (isCorrect('equality', target, expr!) && attempts < 100);
			return (
				expr ??
				generateExpressionForTarget(target + 1, config.equalityOps, config.equalityOperandMax)
			);
		}
		default:
			return 0;
	}
}

function generateExpressionForTarget(target: number, ops: string[], maxOperand: number): string {
	const op = ops[getRandomInt(0, ops.length - 1)];

	switch (op) {
		case '+': {
			const a = getRandomInt(0, Math.min(target, maxOperand));
			const b = target - a;
			if (b < 0 || b > maxOperand)
				return `${Math.floor(target / 2)} + ${target - Math.floor(target / 2)}`;
			return `${a} + ${b}`;
		}
		case '-': {
			const b = getRandomInt(0, maxOperand);
			const a = target + b;
			if (a > maxOperand * 2) return `${target + 1} - 1`;
			return `${a} - ${b}`;
		}
		case '×': {
			// Find factor pairs of target
			const factorPairs: [number, number][] = [];
			for (let i = 1; i <= Math.min(target, maxOperand); i++) {
				if (target % i === 0 && target / i <= maxOperand) {
					factorPairs.push([i, target / i]);
				}
			}
			if (factorPairs.length === 0) return `${target} × 1`;
			const pair = factorPairs[getRandomInt(0, factorPairs.length - 1)];
			return `${pair[0]} × ${pair[1]}`;
		}
		case '÷': {
			const b = getRandomInt(1, Math.min(maxOperand, 12));
			const a = target * b;
			if (a > maxOperand * maxOperand) return `${target * 2} ÷ 2`;
			return `${a} ÷ ${b}`;
		}
		default:
			return `${target} + 0`;
	}
}

export function generateIncorrectValue(
	mode: GameMode,
	target: number,
	difficulty: Difficulty
): CellValue {
	const config = DIFFICULTY_CONFIGS[difficulty];

	switch (mode) {
		case 'multiples': {
			// Generate a number that is NOT a multiple of target
			let val: number;
			let attempts = 0;
			do {
				val = getRandomInt(config.multiplesNumberRange[0], config.multiplesNumberRange[1]);
				attempts++;
			} while (val % target === 0 && attempts < 100);
			return val;
		}
		case 'factors': {
			// Generate a number that is NOT a factor of target
			let val: number;
			let attempts = 0;
			do {
				val = getRandomInt(1, Math.max(target, config.factorsRange[1]));
				attempts++;
			} while (target % val === 0 && attempts < 100);
			return val;
		}
		case 'primes': {
			// Generate a composite number
			let val: number;
			let attempts = 0;
			do {
				val = getRandomInt(config.primesRange[0], config.primesRange[1]);
				attempts++;
			} while (isPrime(val) && attempts < 100);
			if (isPrime(val)) return 4; // fallback
			return val;
		}
		case 'equality': {
			// Generate an expression that does NOT equal target
			let wrongTarget: number;
			do {
				wrongTarget = getRandomInt(Math.max(1, target - 15), target + 15);
			} while (wrongTarget === target);
			return generateExpressionForTarget(
				wrongTarget,
				config.equalityOps,
				config.equalityOperandMax
			);
		}
		case 'inequality': {
			// For inequality, incorrect means it EQUALS the target
			return generateExpressionForTarget(target, config.equalityOps, config.equalityOperandMax);
		}
		default:
			return 0;
	}
}

export function generateBoard(mode: GameMode, target: number, difficulty: Difficulty): BoardData {
	const totalCells = BOARD_ROWS * BOARD_COLS;
	const correctCount = getRandomInt(MIN_CORRECT, MAX_CORRECT);

	// Create flat array of values
	const values: CellValue[] = [];
	const correctIndices = new Set<number>();

	// Randomly choose which cells will be correct
	while (correctIndices.size < correctCount) {
		correctIndices.add(getRandomInt(0, totalCells - 1));
	}

	// Fill the board
	for (let i = 0; i < totalCells; i++) {
		if (correctIndices.has(i)) {
			let val = generateCorrectValue(mode, target, difficulty);
			// Verify it's actually correct
			let attempts = 0;
			while (!isCorrect(mode, target, val) && attempts < 50) {
				val = generateCorrectValue(mode, target, difficulty);
				attempts++;
			}
			values.push(val);
		} else {
			let val = generateIncorrectValue(mode, target, difficulty);
			// Verify it's actually incorrect
			let attempts = 0;
			while (isCorrect(mode, target, val) && attempts < 50) {
				val = generateIncorrectValue(mode, target, difficulty);
				attempts++;
			}
			values.push(val);
		}
	}

	// Convert to 2D array
	const cells: CellValue[][] = [];
	for (let r = 0; r < BOARD_ROWS; r++) {
		cells.push(values.slice(r * BOARD_COLS, (r + 1) * BOARD_COLS));
	}

	// Recount actual correct values (in case generation had issues)
	let actualCorrect = 0;
	for (let r = 0; r < BOARD_ROWS; r++) {
		for (let c = 0; c < BOARD_COLS; c++) {
			if (isCorrect(mode, target, cells[r][c])) {
				actualCorrect++;
			}
		}
	}

	return { cells, correctCount: actualCorrect };
}

export function countRemainingCorrect(
	cells: CellValue[][],
	eaten: boolean[][],
	mode: GameMode,
	target: number
): number {
	let count = 0;
	for (let r = 0; r < BOARD_ROWS; r++) {
		for (let c = 0; c < BOARD_COLS; c++) {
			if (!eaten[r][c] && isCorrect(mode, target, cells[r][c])) {
				count++;
			}
		}
	}
	return count;
}
