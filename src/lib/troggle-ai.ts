import { BOARD_ROWS, BOARD_COLS } from './board';
import type { TroggleType } from './levels';

export interface TroggleState {
	id: number;
	type: TroggleType;
	row: number;
	col: number;
	prevRow: number;
	prevCol: number;
	moveProgress: number; // 0 to 1 for interpolation
	isMoving: boolean;
	direction: 'up' | 'down' | 'left' | 'right';
	alive: boolean;
	animFrame: number;
}

type Direction = 'up' | 'down' | 'left' | 'right';

const DIRECTIONS: Direction[] = ['up', 'down', 'left', 'right'];

function getDelta(dir: Direction): [number, number] {
	switch (dir) {
		case 'up':
			return [-1, 0];
		case 'down':
			return [1, 0];
		case 'left':
			return [0, -1];
		case 'right':
			return [0, 1];
	}
}

function isValidCell(row: number, col: number): boolean {
	return row >= 0 && row < BOARD_ROWS && col >= 0 && col < BOARD_COLS;
}

function getOpposite(dir: Direction): Direction {
	switch (dir) {
		case 'up':
			return 'down';
		case 'down':
			return 'up';
		case 'left':
			return 'right';
		case 'right':
			return 'left';
	}
}

function getRandomDirection(): Direction {
	return DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
}

function getValidDirections(row: number, col: number, safetyCells?: Set<string>): Direction[] {
	return DIRECTIONS.filter((dir) => {
		const [dr, dc] = getDelta(dir);
		const nr = row + dr;
		const nc = col + dc;
		if (!isValidCell(nr, nc)) return false;
		if (safetyCells?.has(`${nr},${nc}`)) return false;
		return true;
	});
}

// Reggie: Moves in straight lines, changes direction at edges or randomly
function moveReggie(troggle: TroggleState, safetyCells?: Set<string>): [number, number] {
	const [dr, dc] = getDelta(troggle.direction);
	const nr = troggle.row + dr;
	const nc = troggle.col + dc;

	if (isValidCell(nr, nc) && !safetyCells?.has(`${nr},${nc}`) && Math.random() > 0.2) {
		return [nr, nc];
	}

	// Change direction
	const valid = getValidDirections(troggle.row, troggle.col, safetyCells);
	if (valid.length === 0) return [troggle.row, troggle.col];

	const newDir = valid[Math.floor(Math.random() * valid.length)];
	troggle.direction = newDir;
	const [ndr, ndc] = getDelta(newDir);
	return [troggle.row + ndr, troggle.col + ndc];
}

// Bashful: Random movement, runs away from muncher when close
function moveBashful(
	troggle: TroggleState,
	muncherRow: number,
	muncherCol: number,
	safetyCells?: Set<string>
): [number, number] {
	const dist = Math.abs(troggle.row - muncherRow) + Math.abs(troggle.col - muncherCol);

	if (dist <= 3) {
		// Run away from muncher
		const valid = getValidDirections(troggle.row, troggle.col, safetyCells);
		if (valid.length === 0) return [troggle.row, troggle.col];

		// Pick direction that maximizes distance from muncher
		let bestDir = valid[0];
		let bestDist = -1;
		for (const dir of valid) {
			const [dr, dc] = getDelta(dir);
			const nr = troggle.row + dr;
			const nc = troggle.col + dc;
			const newDist = Math.abs(nr - muncherRow) + Math.abs(nc - muncherCol);
			if (newDist > bestDist) {
				bestDist = newDist;
				bestDir = dir;
			}
		}
		troggle.direction = bestDir;
		const [dr, dc] = getDelta(bestDir);
		return [troggle.row + dr, troggle.col + dc];
	}

	// Random movement
	const valid = getValidDirections(troggle.row, troggle.col, safetyCells);
	if (valid.length === 0) return [troggle.row, troggle.col];
	const dir = valid[Math.floor(Math.random() * valid.length)];
	troggle.direction = dir;
	const [dr, dc] = getDelta(dir);
	return [troggle.row + dr, troggle.col + dc];
}

// Helper: Random wandering (eats answers - handled in game state)
function moveHelper(troggle: TroggleState, safetyCells?: Set<string>): [number, number] {
	const valid = getValidDirections(troggle.row, troggle.col, safetyCells);
	if (valid.length === 0) return [troggle.row, troggle.col];

	// Prefer continuing in same direction
	if (Math.random() > 0.4) {
		const [dr, dc] = getDelta(troggle.direction);
		const nr = troggle.row + dr;
		const nc = troggle.col + dc;
		if (isValidCell(nr, nc) && !safetyCells?.has(`${nr},${nc}`)) {
			return [nr, nc];
		}
	}

	const dir = valid[Math.floor(Math.random() * valid.length)];
	troggle.direction = dir;
	const [dr, dc] = getDelta(dir);
	return [troggle.row + dr, troggle.col + dc];
}

// Worker: Random wandering (changes answers - handled in game state)
function moveWorker(troggle: TroggleState, safetyCells?: Set<string>): [number, number] {
	// Same movement as helper
	return moveHelper(troggle, safetyCells);
}

// Smartie: Always chases the muncher
function moveSmartie(
	troggle: TroggleState,
	muncherRow: number,
	muncherCol: number,
	safetyCells?: Set<string>
): [number, number] {
	const valid = getValidDirections(troggle.row, troggle.col, safetyCells);
	if (valid.length === 0) return [troggle.row, troggle.col];

	// Pick direction that minimizes distance to muncher
	let bestDir = valid[0];
	let bestDist = Infinity;
	for (const dir of valid) {
		const [dr, dc] = getDelta(dir);
		const nr = troggle.row + dr;
		const nc = troggle.col + dc;
		const newDist = Math.abs(nr - muncherRow) + Math.abs(nc - muncherCol);
		if (newDist < bestDist) {
			bestDist = newDist;
			bestDir = dir;
		}
	}
	troggle.direction = bestDir;
	const [dr, dc] = getDelta(bestDir);
	return [troggle.row + dr, troggle.col + dc];
}

export function moveTroggle(
	troggle: TroggleState,
	muncherRow: number,
	muncherCol: number,
	safetyCells?: Set<string>
): [number, number] {
	switch (troggle.type) {
		case 'reggie':
			return moveReggie(troggle, safetyCells);
		case 'bashful':
			return moveBashful(troggle, muncherRow, muncherCol, safetyCells);
		case 'helper':
			return moveHelper(troggle, safetyCells);
		case 'worker':
			return moveWorker(troggle, safetyCells);
		case 'smartie':
			return moveSmartie(troggle, muncherRow, muncherCol, safetyCells);
	}
}

export function spawnTroggle(
	id: number,
	type: TroggleType,
	existingPositions: Array<{ row: number; col: number }>
): TroggleState {
	// Spawn from a random edge
	const edge = Math.floor(Math.random() * 4);
	let row: number, col: number;

	switch (edge) {
		case 0: // top
			row = 0;
			col = Math.floor(Math.random() * BOARD_COLS);
			break;
		case 1: // bottom
			row = BOARD_ROWS - 1;
			col = Math.floor(Math.random() * BOARD_COLS);
			break;
		case 2: // left
			row = Math.floor(Math.random() * BOARD_ROWS);
			col = 0;
			break;
		default: // right
			row = Math.floor(Math.random() * BOARD_ROWS);
			col = BOARD_COLS - 1;
			break;
	}

	// Avoid spawning on top of existing entities
	let attempts = 0;
	while (existingPositions.some((p) => p.row === row && p.col === col) && attempts < 20) {
		row = Math.floor(Math.random() * BOARD_ROWS);
		col = Math.floor(Math.random() * BOARD_COLS);
		attempts++;
	}

	return {
		id,
		type,
		row,
		col,
		prevRow: row,
		prevCol: col,
		moveProgress: 1,
		isMoving: false,
		direction: getRandomDirection(),
		alive: true,
		animFrame: 0
	};
}
