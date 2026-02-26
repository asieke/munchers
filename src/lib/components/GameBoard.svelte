<script lang="ts">
	import {
		getState,
		moveMuncher,
		completeMuncherMove,
		munchCell,
		togglePause,
		returnToTitle
	} from '$lib/state.svelte';
	import { initAudio, playPause } from '$lib/audio';
	import { BOARD_ROWS, BOARD_COLS } from '$lib/board';
	import Muncher from './Muncher.svelte';
	import Troggle from './Troggle.svelte';
	import HUD from './HUD.svelte';

	const gameState = getState();

	// Cell dimensions for pixel-perfect layout
	const CELL_WIDTH = 96;
	const CELL_HEIGHT = 72;
	const GRID_BORDER = 4;
	const GRID_WIDTH = BOARD_COLS * CELL_WIDTH + (BOARD_COLS + 1) * GRID_BORDER;
	const GRID_HEIGHT = BOARD_ROWS * CELL_HEIGHT + (BOARD_ROWS + 1) * GRID_BORDER;

	// Movement animation
	const MOVE_DURATION = 120; // ms

	// Key repeat handling
	let heldKey: string | null = $state(null);
	let keyRepeatDelayTimer: number | null = null;
	let keyRepeatIntervalTimer: number | null = null;
	const KEY_REPEAT_DELAY = 180;
	const KEY_REPEAT_INTERVAL = 100;

	// Animation loop
	let animFrameId: number;
	let lastAnimTime = 0;
	const SPRITE_FRAME_INTERVAL = 150; // ms between sprite frame changes
	let spriteTimer = 0;

	function gameLoop(timestamp: number) {
		if (!lastAnimTime) lastAnimTime = timestamp;
		const dt = timestamp - lastAnimTime;
		lastAnimTime = timestamp;

		if (!gameState.isPaused) {
			// Update muncher movement interpolation
			if (gameState.muncher.isMoving) {
				const m = gameState.muncher;
				m.moveProgress = Math.min(1, m.moveProgress + dt / MOVE_DURATION);
				if (m.moveProgress >= 1) {
					completeMuncherMove();
				}
			}

			// Update troggle movement interpolation
			for (const t of gameState.troggles) {
				if (t.isMoving) {
					t.moveProgress = Math.min(1, t.moveProgress + dt / 300);
					if (t.moveProgress >= 1) {
						t.isMoving = false;
						t.moveProgress = 1;
					}
				}
			}

			// Sprite animation timer
			spriteTimer += dt;
			if (spriteTimer >= SPRITE_FRAME_INTERVAL) {
				spriteTimer -= SPRITE_FRAME_INTERVAL;
				gameState.muncher.animFrame = (gameState.muncher.animFrame + 1) % 4;
				for (const t of gameState.troggles) {
					t.animFrame = (t.animFrame + 1) % 4;
				}
			}
		}

		animFrameId = requestAnimationFrame(gameLoop);
	}

	$effect(() => {
		animFrameId = requestAnimationFrame(gameLoop);
		return () => {
			cancelAnimationFrame(animFrameId);
			stopKeyRepeat();
		};
	});

	function startKeyRepeat(direction: 'up' | 'down' | 'left' | 'right') {
		stopKeyRepeat();
		keyRepeatDelayTimer = window.setTimeout(() => {
			keyRepeatDelayTimer = null;
			keyRepeatIntervalTimer = window.setInterval(() => {
				moveMuncher(direction);
			}, KEY_REPEAT_INTERVAL);
		}, KEY_REPEAT_DELAY);
	}

	function stopKeyRepeat() {
		if (keyRepeatDelayTimer) {
			clearTimeout(keyRepeatDelayTimer);
			keyRepeatDelayTimer = null;
		}
		if (keyRepeatIntervalTimer) {
			clearInterval(keyRepeatIntervalTimer);
			keyRepeatIntervalTimer = null;
		}
		heldKey = null;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.repeat) return; // We handle repeat ourselves
		initAudio();

		switch (e.key) {
			case 'ArrowUp':
				e.preventDefault();
				moveMuncher('up');
				heldKey = 'up';
				startKeyRepeat('up');
				break;
			case 'ArrowDown':
				e.preventDefault();
				moveMuncher('down');
				heldKey = 'down';
				startKeyRepeat('down');
				break;
			case 'ArrowLeft':
				e.preventDefault();
				moveMuncher('left');
				heldKey = 'left';
				startKeyRepeat('left');
				break;
			case 'ArrowRight':
				e.preventDefault();
				moveMuncher('right');
				heldKey = 'right';
				startKeyRepeat('right');
				break;
			case ' ':
			case 'Enter':
				e.preventDefault();
				munchCell();
				break;
			case 'Escape':
				e.preventDefault();
				togglePause();
				playPause();
				break;
		}
	}

	function handleKeyup(e: KeyboardEvent) {
		const keyMap: Record<string, string> = {
			ArrowUp: 'up',
			ArrowDown: 'down',
			ArrowLeft: 'left',
			ArrowRight: 'right'
		};
		if (keyMap[e.key] === heldKey) {
			stopKeyRepeat();
		}
	}

	function getCellX(col: number): number {
		return GRID_BORDER + col * (CELL_WIDTH + GRID_BORDER);
	}

	function getCellY(row: number): number {
		return GRID_BORDER + row * (CELL_HEIGHT + GRID_BORDER);
	}

	function getInterpolatedX(prevCol: number, col: number, progress: number): number {
		const fromX = getCellX(prevCol);
		const toX = getCellX(col);
		return fromX + (toX - fromX) * easeOutQuad(progress);
	}

	function getInterpolatedY(prevRow: number, row: number, progress: number): number {
		const fromY = getCellY(prevRow);
		const toY = getCellY(row);
		return fromY + (toY - fromY) * easeOutQuad(progress);
	}

	function easeOutQuad(t: number): number {
		return t * (2 - t);
	}

	function formatCellValue(val: string | number): string {
		return String(val);
	}
</script>

<svelte:window onkeydown={handleKeydown} onkeyup={handleKeyup} />

<div
	class="flex h-full w-full flex-col"
	style="background-color: #00008B; font-family: 'Press Start 2P', monospace;"
	class:animate-shake={gameState.shakeScreen}
>
	<!-- HUD Top -->
	<HUD />

	<!-- Game Grid -->
	<div class="flex flex-1 items-center justify-center">
		<div
			class="relative"
			style="width: {GRID_WIDTH}px; height: {GRID_HEIGHT}px; background-color: #FF00FF; border: 3px solid #FF00FF;"
		>
			<!-- Grid cells -->
			{#each Array(BOARD_ROWS) as _, row}
				{#each Array(BOARD_COLS) as _, col}
					{@const x = getCellX(col)}
					{@const y = getCellY(row)}
					{@const eaten = gameState.eatenCells[row]?.[col]}
					{@const isSafety = gameState.safetyCells.has(`${row},${col}`)}
					{@const cellValue = gameState.boardCells[row]?.[col]}
					<div
						class="absolute flex items-center justify-center"
						style="left: {x}px; top: {y}px; width: {CELL_WIDTH}px; height: {CELL_HEIGHT}px; background-color: #00008B;"
						class:cell-flash={gameState.flashCorrect &&
							gameState.muncher.row === row &&
							gameState.muncher.col === col}
					>
						{#if !eaten && cellValue !== undefined}
							<span
								class="text-center text-white"
								style="font-size: {String(cellValue).length > 5
									? '10px'
									: String(cellValue).length > 3
										? '12px'
										: '16px'};"
							>
								{formatCellValue(cellValue)}
							</span>
						{/if}

						{#if isSafety}
							<!-- Safety square indicators -->
							<div class="pointer-events-none absolute inset-0">
								<div class="absolute top-1 left-1 h-2 w-2 bg-white"></div>
								<div class="absolute top-1 right-1 h-2 w-2 bg-white"></div>
								<div class="absolute bottom-1 left-1 h-2 w-2 bg-white"></div>
								<div class="absolute right-1 bottom-1 h-2 w-2 bg-white"></div>
							</div>
						{/if}
					</div>
				{/each}
			{/each}

			<!-- Troggles -->
			{#each gameState.troggles as troggle (troggle.id)}
				{@const tx = troggle.isMoving
					? getInterpolatedX(troggle.prevCol, troggle.col, troggle.moveProgress)
					: getCellX(troggle.col)}
				{@const ty = troggle.isMoving
					? getInterpolatedY(troggle.prevRow, troggle.row, troggle.moveProgress)
					: getCellY(troggle.row)}
				<div
					class="pointer-events-none absolute"
					style="left: {tx}px; top: {ty}px; width: {CELL_WIDTH}px; height: {CELL_HEIGHT}px; z-index: 10;"
				>
					<Troggle type={troggle.type} animFrame={troggle.animFrame} />
				</div>
			{/each}

			<!-- Muncher -->
			{#if true}
				{@const mx = gameState.muncher.isMoving
					? getInterpolatedX(
							gameState.muncher.prevCol,
							gameState.muncher.col,
							gameState.muncher.moveProgress
						)
					: getCellX(gameState.muncher.col)}
				{@const my = gameState.muncher.isMoving
					? getInterpolatedY(
							gameState.muncher.prevRow,
							gameState.muncher.row,
							gameState.muncher.moveProgress
						)
					: getCellY(gameState.muncher.row)}
				<div
					class="pointer-events-none absolute"
					style="left: {mx}px; top: {my}px; width: {CELL_WIDTH}px; height: {CELL_HEIGHT}px; z-index: 20;"
					class:animate-blink={gameState.muncher.isInvincible}
				>
					<Muncher
						isMoving={gameState.muncher.isMoving}
						isEating={gameState.muncher.isEating}
						isDying={gameState.muncher.isDying}
						facing={gameState.muncher.facing}
						animFrame={gameState.muncher.animFrame}
					/>
				</div>
			{/if}
		</div>
	</div>

	<!-- Bottom HUD: Score + Lives -->
	<div class="flex items-center justify-between px-4 py-2">
		<div class="flex items-center gap-2">
			<span class="text-sm text-white">Score:</span>
			<div class="border-2 px-3 py-1" style="border-color: #FF00FF; background-color: #000066;">
				<span class="text-sm text-white">{gameState.score}</span>
			</div>
		</div>
		<div class="flex items-center gap-1">
			{#each Array(Math.max(0, gameState.lives)) as _}
				<img
					src="/sprites/lives-icon.png"
					alt="Life"
					class="h-6 w-6"
					style="image-rendering: pixelated;"
				/>
			{/each}
		</div>
	</div>

	<!-- Pause Overlay -->
	{#if gameState.isPaused}
		<div
			class="absolute inset-0 z-50 flex flex-col items-center justify-center"
			style="background-color: rgba(0, 0, 0, 0.8);"
		>
			<h2 class="mb-8 text-2xl text-white">PAUSED</h2>
			<div class="flex flex-col gap-4">
				<button
					class="border-2 px-6 py-2 text-xs text-white"
					style="font-family: 'Press Start 2P', monospace; border-color: #FF00FF; background-color: #000066;"
					onclick={() => togglePause()}
				>
					Resume
				</button>
				<button
					class="border-2 px-6 py-2 text-xs text-white"
					style="font-family: 'Press Start 2P', monospace; border-color: #FF00FF; background-color: #000066;"
					onclick={() => returnToTitle()}
				>
					Quit to Menu
				</button>
			</div>
		</div>
	{/if}
</div>

<style>
	.cell-flash {
		animation: flash 0.2s ease-out;
	}

	@keyframes flash {
		0% {
			background-color: #4444ff;
		}
		100% {
			background-color: #00008b;
		}
	}

	.animate-shake {
		animation: shake 0.3s ease-out;
	}

	@keyframes shake {
		0%,
		100% {
			transform: translateX(0);
		}
		25% {
			transform: translateX(-4px);
		}
		50% {
			transform: translateX(4px);
		}
		75% {
			transform: translateX(-2px);
		}
	}

	.animate-blink {
		animation: blink 0.2s infinite alternate;
	}

	@keyframes blink {
		0% {
			opacity: 1;
		}
		100% {
			opacity: 0.3;
		}
	}
</style>
