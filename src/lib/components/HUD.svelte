<script lang="ts">
	import { getState } from '$lib/state.svelte';

	const gameState = getState();
</script>

<div
	class="flex items-center justify-between px-4 py-2"
	style="font-family: 'Press Start 2P', monospace; background-color: #00008B;"
>
	<div>
		<span class="text-sm text-white">Level: {gameState.level}</span>
	</div>
	<div class="border-b-2 px-4 pb-1" style="border-color: #FFFFFF;">
		<span class="text-sm text-white">{gameState.challengeText}</span>
	</div>
	<div>
		<span class="text-xs" style="color: #888888;">
			{gameState.difficulty.toUpperCase()}
		</span>
	</div>
</div>
