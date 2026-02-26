<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { getState, cleanup } from '$lib/state.svelte';
	import TitleScreen from '$lib/components/TitleScreen.svelte';
	import ModeSelect from '$lib/components/ModeSelect.svelte';
	import GameBoard from '$lib/components/GameBoard.svelte';
	import LevelComplete from '$lib/components/LevelComplete.svelte';
	import GameOver from '$lib/components/GameOver.svelte';
	import EnterInitials from '$lib/components/EnterInitials.svelte';
	import HighScores from '$lib/components/HighScores.svelte';

	const gameState = getState();

	let viewport: HTMLElement | null = null;

	function updateScale() {
		viewport = document.getElementById('game-viewport');
		if (!viewport) return;

		const container = viewport.parentElement;
		if (!container) return;

		const containerW = container.clientWidth;
		const containerH = container.clientHeight;
		const gameW = 640;
		const gameH = 480;

		const scaleX = containerW / gameW;
		const scaleY = containerH / gameH;
		const scale = Math.min(scaleX, scaleY);

		viewport.style.transform = `scale(${scale})`;
	}

	onMount(() => {
		updateScale();
		window.addEventListener('resize', updateScale);
	});

	onDestroy(() => {
		cleanup();
		if (typeof window !== 'undefined') {
			window.removeEventListener('resize', updateScale);
		}
	});
</script>

{#if gameState.screen === 'title'}
	<TitleScreen />
{:else if gameState.screen === 'modeSelect'}
	<ModeSelect />
{:else if gameState.screen === 'playing' || gameState.screen === 'paused'}
	<GameBoard />
{:else if gameState.screen === 'levelComplete'}
	<LevelComplete />
{:else if gameState.screen === 'gameOver'}
	<GameOver />
{:else if gameState.screen === 'enterInitials'}
	<EnterInitials />
{:else if gameState.screen === 'highScores'}
	<HighScores />
{/if}
