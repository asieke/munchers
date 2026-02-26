<script lang="ts">
	import { getState, returnToTitle, goToEnterInitials, startGame } from '$lib/state.svelte';
	import { isHighScore } from '$lib/storage';
	import { playMenuSelect, initAudio } from '$lib/audio';

	const gameState = getState();
	const isNewHighScore = $derived(isHighScore(gameState.score, gameState.gameMode));

	let selectedIndex = $state(0);
	const options = ['Play Again', 'Enter Initials', 'Main Menu'];

	function handleKeydown(e: KeyboardEvent) {
		initAudio();
		switch (e.key) {
			case 'ArrowUp':
				e.preventDefault();
				selectedIndex = (selectedIndex - 1 + options.length) % options.length;
				playMenuSelect();
				break;
			case 'ArrowDown':
				e.preventDefault();
				selectedIndex = (selectedIndex + 1) % options.length;
				playMenuSelect();
				break;
			case 'Enter':
			case ' ':
				e.preventDefault();
				selectOption();
				break;
		}
	}

	function selectOption() {
		switch (selectedIndex) {
			case 0:
				startGame();
				break;
			case 1:
				goToEnterInitials();
				break;
			case 2:
				returnToTitle();
				break;
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div
	class="flex h-full w-full flex-col items-center justify-center"
	style="background-color: #00008B; font-family: 'Press Start 2P', monospace;"
>
	<h2 class="mb-6 text-2xl text-white" style="text-shadow: 3px 3px 0px #FF0000;">GAME OVER</h2>

	<div class="mb-8 text-center">
		<p class="mb-2 text-lg text-white">Final Score</p>
		<p class="text-2xl" style="color: #FF00FF;">{gameState.score}</p>
	</div>

	{#if isNewHighScore}
		<p class="mb-6 text-sm" style="color: #FFFF00; animation: blink 1s infinite;">
			NEW HIGH SCORE!
		</p>
	{/if}

	<div class="flex flex-col gap-3">
		{#each options as option, i}
			<button
				class="w-56 border-2 px-4 py-2 text-center text-xs"
				style="font-family: 'Press Start 2P', monospace; {selectedIndex === i
					? 'background-color: #FF00FF; color: #FFFFFF; border-color: #FF88CC;'
					: 'background-color: #000066; color: #FFFFFF; border-color: #FF00FF;'}"
				onclick={() => {
					selectedIndex = i;
					selectOption();
				}}
				onmouseenter={() => {
					selectedIndex = i;
				}}
			>
				{option}
			</button>
		{/each}
	</div>
</div>

<style>
	@keyframes blink {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0;
		}
	}
</style>
