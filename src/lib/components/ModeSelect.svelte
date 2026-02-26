<script lang="ts">
	import type { GameMode, Difficulty } from '$lib/logic';
	import { setDifficulty, setGameMode, setScreen, startGame, getState } from '$lib/state.svelte';
	import { initAudio, playMenuSelect } from '$lib/audio';

	const gameState = getState();

	type ModeItem = {
		label: string;
		mode: GameMode;
		desc: string;
	};

	const modeItems: ModeItem[] = [
		{ label: 'Multiples', mode: 'multiples', desc: 'Find multiples of a number' },
		{ label: 'Factors', mode: 'factors', desc: 'Find factors of a number' },
		{ label: 'Primes', mode: 'primes', desc: 'Find the prime numbers' },
		{ label: 'Equality', mode: 'equality', desc: 'Find expressions that equal the target' },
		{
			label: 'Inequality',
			mode: 'inequality',
			desc: 'Find expressions that do NOT equal the target'
		},
		{ label: 'Challenge', mode: 'challenge', desc: 'All modes - rotating challenges!' }
	];

	const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];
	const difficultyColors: Record<Difficulty, string> = {
		easy: '#00FF00',
		medium: '#FFFF00',
		hard: '#FF4444'
	};

	let selectedIndex = $state(0);
	let difficultyIndex = $state(difficulties.indexOf(gameState.difficulty));

	function selectMode(): void {
		const item = modeItems[selectedIndex];
		setGameMode(item.mode);
		startGame();
	}

	function handleKeydown(e: KeyboardEvent) {
		initAudio();
		switch (e.key) {
			case 'ArrowUp':
				e.preventDefault();
				selectedIndex = (selectedIndex - 1 + modeItems.length) % modeItems.length;
				playMenuSelect();
				break;
			case 'ArrowDown':
				e.preventDefault();
				selectedIndex = (selectedIndex + 1) % modeItems.length;
				playMenuSelect();
				break;
			case 'ArrowLeft':
				e.preventDefault();
				difficultyIndex = (difficultyIndex - 1 + difficulties.length) % difficulties.length;
				setDifficulty(difficulties[difficultyIndex]);
				playMenuSelect();
				break;
			case 'ArrowRight':
				e.preventDefault();
				difficultyIndex = (difficultyIndex + 1) % difficulties.length;
				setDifficulty(difficulties[difficultyIndex]);
				playMenuSelect();
				break;
			case 'Enter':
			case ' ':
				e.preventDefault();
				selectMode();
				break;
			case 'Escape':
				e.preventDefault();
				setScreen('title');
				break;
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div
	class="flex h-full w-full flex-col items-center justify-center"
	style="background-color: #000022; font-family: 'Press Start 2P', monospace;"
>
	<!-- Header -->
	<div class="mb-6 text-center">
		<h2 class="text-lg" style="color: #FFFF00;">SELECT GAME MODE</h2>
		<p class="mt-2" style="color: #888888; font-size: 7px;">Press ESC to go back</p>
	</div>

	<!-- Mode list -->
	<div class="mb-6 flex flex-col items-center gap-2">
		{#each modeItems as item, i}
			<button
				class="w-80 border-2 px-4 py-2 text-left text-xs"
				style="
					border-color: {selectedIndex === i ? '#FF00FF' : '#333366'};
					background-color: {selectedIndex === i ? '#220044' : '#000033'};
					color: {selectedIndex === i ? '#FFFFFF' : '#888888'};
				"
				onmouseenter={() => {
					selectedIndex = i;
					playMenuSelect();
				}}
				onclick={() => {
					initAudio();
					selectedIndex = i;
					selectMode();
				}}
			>
				<div class="flex items-center gap-2">
					{#if selectedIndex === i}
						<span style="color: #FF4444;">&#9658;</span>
					{:else}
						<span>&nbsp;&nbsp;</span>
					{/if}
					<span>{item.label}</span>
				</div>
				{#if selectedIndex === i}
					<p class="mt-1 pl-4" style="color: #AAAAAA; font-size: 7px;">
						{item.desc}
					</p>
				{/if}
			</button>
		{/each}
	</div>

	<!-- Difficulty selector -->
	<div class="flex items-center gap-4">
		<span style="color: #AAAAAA; font-size: 9px;"> Difficulty: </span>
		<div class="flex gap-2">
			{#each difficulties as diff, i}
				<button
					class="border-2 px-3 py-1 uppercase"
					style="
						font-size: 9px;
						border-color: {difficultyIndex === i ? difficultyColors[diff] : '#333366'};
						background-color: {difficultyIndex === i ? '#220044' : '#000033'};
						color: {difficultyIndex === i ? difficultyColors[diff] : '#666666'};
					"
					onclick={() => {
						difficultyIndex = i;
						setDifficulty(difficulties[i]);
						playMenuSelect();
					}}
				>
					{diff}
				</button>
			{/each}
		</div>
	</div>

	<!-- Arrow keys hint -->
	<p class="mt-4" style="color: #666666; font-size: 7px;">
		&#9668; &#9658; Change Difficulty &nbsp; | &nbsp; &#9650; &#9660; Select Mode &nbsp; | &nbsp;
		Enter to Start
	</p>
</div>
