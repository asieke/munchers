<script lang="ts">
	import './layout.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href="/sprites/pwa-icon-192.png" />
	<title>Number Munchers</title>
</svelte:head>

<div
	id="game-container"
	class="flex h-screen w-screen items-center justify-center overflow-hidden"
	style="background-color: #000000;"
>
	<div
		id="game-viewport"
		class="relative overflow-hidden"
		style="width: 640px; height: 480px; background-color: #00008B; image-rendering: pixelated;"
	>
		{@render children()}
	</div>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		overflow: hidden;
	}

	#game-viewport {
		transform-origin: center center;
	}
</style>
