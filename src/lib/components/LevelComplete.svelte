<script lang="ts">
	import { getState } from '$lib/state.svelte';
	import Muncher from './Muncher.svelte';

	const gameState = getState();
</script>

<div
	class="flex h-full w-full flex-col items-center justify-center"
	style="background-color: #00008B; font-family: 'Press Start 2P', monospace;"
>
	<div class="mb-4" style="width: 96px; height: 80px;">
		<Muncher isEating={true} />
	</div>

	<h2 class="mb-6 text-xl text-white" style="text-shadow: 2px 2px 0px #FF00FF;">
		Level {gameState.level} Complete!
	</h2>

	<div class="mb-4 flex flex-col items-center gap-2">
		<p class="text-sm text-white">Score: {gameState.score}</p>
	</div>

	<p class="mt-8 text-xs" style="color: #888888;">Get Ready...</p>
</div>
