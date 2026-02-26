<script lang="ts">
	import { getState, returnToTitle, goToHighScores } from '$lib/state.svelte';
	import { addHighScore } from '$lib/storage';
	import { playMenuSelect, initAudio } from '$lib/audio';

	const gameState = getState();

	const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
	let initials = $state(['A', 'A', 'A']);
	let currentPos = $state(0);

	function handleKeydown(e: KeyboardEvent) {
		initAudio();
		switch (e.key) {
			case 'ArrowUp': {
				e.preventDefault();
				const idx = CHARS.indexOf(initials[currentPos]);
				initials[currentPos] = CHARS[(idx + 1) % CHARS.length];
				playMenuSelect();
				break;
			}
			case 'ArrowDown': {
				e.preventDefault();
				const idx2 = CHARS.indexOf(initials[currentPos]);
				initials[currentPos] = CHARS[(idx2 - 1 + CHARS.length) % CHARS.length];
				playMenuSelect();
				break;
			}
			case 'ArrowRight':
				e.preventDefault();
				if (currentPos < 2) currentPos++;
				playMenuSelect();
				break;
			case 'ArrowLeft':
				e.preventDefault();
				if (currentPos > 0) currentPos--;
				playMenuSelect();
				break;
			case 'Enter':
			case ' ':
				e.preventDefault();
				submitScore();
				break;
			case 'Escape':
				e.preventDefault();
				returnToTitle();
				break;
		}
	}

	function submitScore() {
		const name = initials.join('');
		addHighScore({
			name,
			score: gameState.score,
			mode: gameState.gameMode,
			difficulty: gameState.difficulty,
			date: new Date().toISOString()
		});
		goToHighScores();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div
	class="flex h-full w-full flex-col items-center justify-center"
	style="background-color: #00008B; font-family: 'Press Start 2P', monospace;"
>
	<h2 class="mb-6 text-lg text-white">Enter Your Initials</h2>

	<div class="mb-4 text-lg text-white">
		Score: <span style="color: #FF00FF;">{gameState.score}</span>
	</div>

	<div class="mb-8 flex gap-4">
		{#each initials as char, i}
			<div
				class="flex h-16 w-12 items-center justify-center border-2 text-2xl"
				style={currentPos === i
					? 'border-color: #FF00FF; background-color: #000066; color: #FFFFFF;'
					: 'border-color: #888888; background-color: #00004B; color: #AAAAAA;'}
			>
				{char}
			</div>
		{/each}
	</div>

	<div class="text-center">
		<p class="text-xs" style="color: #888888;">Up/Down: Change Letter</p>
		<p class="mt-1 text-xs" style="color: #888888;">Left/Right: Move | Enter: Submit</p>
	</div>
</div>
