<script lang="ts">
	import { returnToTitle } from '$lib/state.svelte';
	import { getHighScoresForMode, clearHighScores, type HighScoreEntry } from '$lib/storage';
	import { playMenuSelect, initAudio } from '$lib/audio';
	import type { GameMode } from '$lib/logic';

	const modes: { label: string; mode: GameMode }[] = [
		{ label: 'Multiples', mode: 'multiples' },
		{ label: 'Factors', mode: 'factors' },
		{ label: 'Primes', mode: 'primes' },
		{ label: 'Equality', mode: 'equality' },
		{ label: 'Inequality', mode: 'inequality' },
		{ label: 'Challenge', mode: 'challenge' }
	];

	let selectedMode = $state(0);
	let scores = $state<HighScoreEntry[]>([]);

	$effect(() => {
		scores = getHighScoresForMode(modes[selectedMode].mode);
	});

	function handleKeydown(e: KeyboardEvent) {
		initAudio();
		switch (e.key) {
			case 'ArrowLeft':
				e.preventDefault();
				selectedMode = (selectedMode - 1 + modes.length) % modes.length;
				playMenuSelect();
				break;
			case 'ArrowRight':
				e.preventDefault();
				selectedMode = (selectedMode + 1) % modes.length;
				playMenuSelect();
				break;
			case 'Escape':
			case 'Enter':
				e.preventDefault();
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
	<h2 class="mb-6 text-lg text-white" style="text-shadow: 2px 2px 0px #FF00FF;">HIGH SCORES</h2>

	<!-- Mode tabs -->
	<div class="mb-4 flex gap-1">
		{#each modes as mode, i}
			<button
				class="border-2 px-2 py-1 text-xs"
				style={selectedMode === i
					? 'background-color: #FF00FF; color: #FFFFFF; border-color: #FF88CC;'
					: 'background-color: #000066; color: #888888; border-color: #FF00FF;'}
				style:font-family="'Press Start 2P', monospace"
				onclick={() => {
					selectedMode = i;
					playMenuSelect();
				}}
			>
				{mode.label.slice(0, 4)}
			</button>
		{/each}
	</div>

	<!-- Score table -->
	<div class="mb-6 w-80">
		<div class="mb-2 flex justify-between border-b px-2 pb-1" style="border-color: #FF00FF;">
			<span class="text-xs text-white">Rank</span>
			<span class="text-xs text-white">Name</span>
			<span class="text-xs text-white">Score</span>
		</div>
		{#if scores.length === 0}
			<p class="mt-4 text-center text-xs" style="color: #888888;">No scores yet</p>
		{:else}
			{#each scores as entry, i}
				<div class="flex justify-between px-2 py-1">
					<span class="text-xs" style="color: {i < 3 ? '#FFFF00' : '#FFFFFF'};">{i + 1}.</span>
					<span class="text-xs" style="color: {i < 3 ? '#FFFF00' : '#FFFFFF'};">{entry.name}</span>
					<span class="text-xs" style="color: {i < 3 ? '#FFFF00' : '#FFFFFF'};">{entry.score}</span>
				</div>
			{/each}
		{/if}
	</div>

	<div class="flex gap-4">
		<button
			class="border-2 px-4 py-2 text-xs text-white"
			style="font-family: 'Press Start 2P', monospace; border-color: #FF00FF; background-color: #000066;"
			onclick={() => returnToTitle()}
		>
			Back
		</button>
		<button
			class="border-2 px-4 py-2 text-xs text-white"
			style="font-family: 'Press Start 2P', monospace; border-color: #FF0000; background-color: #660000;"
			onclick={() => {
				clearHighScores();
				scores = [];
			}}
		>
			Clear
		</button>
	</div>

	<p class="mt-4 text-xs" style="color: #888888; font-size: 7px;">
		Left/Right: Switch Mode | Esc: Back
	</p>
</div>
