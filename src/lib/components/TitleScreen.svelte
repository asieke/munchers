<script lang="ts">
	import { setScreen, getState } from '$lib/state.svelte';
	import { initAudio, playMenuSelect } from '$lib/audio';
	import Muncher from './Muncher.svelte';
	import Troggle from './Troggle.svelte';

	const gameState = getState();

	// Simple animation frame counter for title screen troggles
	let titleAnimFrame = $state(0);
	$effect(() => {
		const interval = setInterval(() => {
			titleAnimFrame = (titleAnimFrame + 1) % 4;
		}, 200);
		return () => clearInterval(interval);
	});

	const menuItems = [
		{ num: 1, label: 'Play Number Munchers', action: () => setScreen('modeSelect') },
		{ num: 2, label: 'Hall of Fame', action: () => setScreen('highScores') },
		{ num: 3, label: 'Information', action: () => {} },
		{ num: 4, label: 'Options', action: () => {} },
		{ num: 5, label: 'Quit', action: () => {} }
	];

	let selectedIndex = $state(0);

	function handleKeydown(e: KeyboardEvent) {
		initAudio();
		switch (e.key) {
			case 'ArrowUp':
				e.preventDefault();
				selectedIndex = (selectedIndex - 1 + menuItems.length) % menuItems.length;
				playMenuSelect();
				break;
			case 'ArrowDown':
				e.preventDefault();
				selectedIndex = (selectedIndex + 1) % menuItems.length;
				playMenuSelect();
				break;
			case 'Enter':
			case ' ':
				e.preventDefault();
				menuItems[selectedIndex].action();
				break;
			case '1':
			case '2':
			case '3':
			case '4':
			case '5': {
				e.preventDefault();
				const idx = parseInt(e.key) - 1;
				selectedIndex = idx;
				playMenuSelect();
				menuItems[idx].action();
				break;
			}
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div
	class="relative flex h-full w-full flex-col items-center overflow-hidden"
	style="background-color: #000000; font-family: 'Press Start 2P', monospace;"
>
	<!-- V-shaped red diagonal stripes background -->
	<div class="pointer-events-none absolute inset-0 overflow-hidden" style="opacity: 0.25;">
		{#each Array(12) as _, i}
			<!-- Left side stripes going down-right -->
			<div
				class="absolute"
				style="
					left: {-80 + i * 50}px;
					top: 0;
					width: 24px;
					height: 800px;
					background-color: #CC0000;
					transform: rotate(35deg);
					transform-origin: top left;
				"
			></div>
			<!-- Right side stripes going down-left -->
			<div
				class="absolute"
				style="
					right: {-80 + i * 50}px;
					top: 0;
					width: 24px;
					height: 800px;
					background-color: #CC0000;
					transform: rotate(-35deg);
					transform-origin: top right;
				"
			></div>
		{/each}
	</div>

	<!-- Main content -->
	<div class="relative z-10 flex h-full w-full flex-col items-center justify-between py-6">
		<!-- Title area -->
		<div class="mt-4 text-center">
			<!-- Decorative sprites at top corners -->
			<div class="absolute top-4 left-4" style="width: 72px; height: 60px;">
				<Muncher />
			</div>
			<div class="absolute top-4 right-4" style="width: 72px; height: 60px;">
				<Troggle type="reggie" animFrame={titleAnimFrame} />
			</div>

			<!-- Title text -->
			<h1
				class="text-3xl leading-relaxed"
				style="
					color: #FFFF00;
					text-shadow:
						3px 3px 0px #CC0000,
						-1px -1px 0px #FF8800,
						2px 0px 0px #FF4400;
					letter-spacing: 4px;
				"
			>
				NUMBER
			</h1>
			<h1
				class="text-3xl leading-relaxed"
				style="
					color: #00FF00;
					text-shadow:
						3px 3px 0px #006600,
						-1px -1px 0px #88FF88,
						2px 0px 0px #00AA00;
					letter-spacing: 4px;
				"
			>
				MUNCHERS
			</h1>

			<!-- Subtitle -->
			<p class="mt-2 text-xs" style="color: #888888; font-size: 7px;">
				A MECC CLASSIC - WEB EDITION
			</p>
		</div>

		<!-- Menu Items -->
		<div class="flex flex-col items-start gap-3" style="margin-left: 160px;">
			{#each menuItems as item, i}
				<button
					class="flex items-center gap-3 text-left text-xs"
					style="color: {selectedIndex === i ? '#FFFF00' : '#FFFFFF'}; font-size: 11px;"
					onmouseenter={() => {
						selectedIndex = i;
						playMenuSelect();
					}}
					onclick={() => {
						initAudio();
						item.action();
					}}
				>
					<span style="color: #FF4444;">{item.num}.</span>
					<span style="display: inline-block; width: 14px; text-align: center; color: #FF4444;"
						>{selectedIndex === i ? '\u25B8' : ''}</span
					>
					<span>{item.label}</span>
				</button>
			{/each}
		</div>

		<!-- Bottom area with character sprites and instructions -->
		<div class="flex w-full flex-col items-center gap-2">
			<!-- Character parade -->
			<div class="mb-2 flex items-end gap-2">
				<div style="width: 64px; height: 60px; transform: scale(0.8);">
					<Troggle type="bashful" animFrame={titleAnimFrame} />
				</div>
				<div style="width: 64px; height: 60px; transform: scale(0.8);">
					<Troggle type="helper" animFrame={titleAnimFrame} />
				</div>
				<div style="width: 72px; height: 60px; transform: scale(0.9);">
					<Muncher />
				</div>
				<div style="width: 64px; height: 60px; transform: scale(0.8);">
					<Troggle type="worker" animFrame={titleAnimFrame} />
				</div>
				<div style="width: 64px; height: 60px; transform: scale(0.8);">
					<Troggle type="smartie" animFrame={titleAnimFrame} />
				</div>
			</div>

			<!-- Instructions -->
			<p style="color: #AAAAAA; font-size: 8px;">Use Arrows to move, then press Enter.</p>
		</div>
	</div>
</div>
