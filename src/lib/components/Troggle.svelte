<script lang="ts">
	import type { TroggleType } from '$lib/levels';

	let { type = 'reggie' as TroggleType, animFrame = 0 } = $props();

	// Color palettes per troggle type
	const COLORS: Record<
		TroggleType,
		{ body: string; dark: string; darkest: string; light: string; pupil: string }
	> = {
		reggie: {
			body: '#FF0000',
			dark: '#CC0000',
			darkest: '#880000',
			light: '#FF4444',
			pupil: '#4444FF'
		},
		bashful: {
			body: '#4444FF',
			dark: '#0000CC',
			darkest: '#000088',
			light: '#6666FF',
			pupil: '#FF0000'
		},
		helper: {
			body: '#00CCCC',
			dark: '#009999',
			darkest: '#004444',
			light: '#44FFFF',
			pupil: '#000000'
		},
		worker: {
			body: '#CC44CC',
			dark: '#880088',
			darkest: '#440066',
			light: '#EE88FF',
			pupil: '#FFFFFF'
		},
		smartie: {
			body: '#FFFF00',
			dark: '#CCCC00',
			darkest: '#666600',
			light: '#FFFF66',
			pupil: '#000000'
		}
	};

	let c = $derived(COLORS[type]);

	// Leg animation: 4 frames cycle
	// 0 = legs together, 1 = legs apart, 2 = legs together, 3 = legs crossed
	let legState = $derived(animFrame % 4);
</script>

<div class="troggle-container">
	<div
		class="troggle"
		style="--body: {c.body}; --dark: {c.dark}; --darkest: {c.darkest}; --light: {c.light}; --pupil: {c.pupil};"
	>
		<!-- Unique features per type -->
		{#if type === 'bashful'}
			<!-- Antennae -->
			<div class="antenna antenna-left">
				<div class="antenna-stalk" style="background: {c.dark};"></div>
				<div class="antenna-tip" style="background: {c.light};"></div>
			</div>
			<div class="antenna antenna-right">
				<div class="antenna-stalk" style="background: {c.dark};"></div>
				<div class="antenna-tip" style="background: {c.light};"></div>
			</div>
		{:else if type === 'helper'}
			<!-- Single horn -->
			<div class="horn-single">
				<div class="horn-shape" style="border-bottom-color: {c.light};"></div>
			</div>
		{:else if type === 'worker'}
			<!-- Devil horns -->
			<div class="horn horn-left">
				<div class="horn-shape" style="border-bottom-color: {c.light};"></div>
			</div>
			<div class="horn horn-right">
				<div class="horn-shape" style="border-bottom-color: {c.light};"></div>
			</div>
		{:else if type === 'smartie'}
			<!-- Graduation cap -->
			<div class="grad-cap">
				<div class="cap-top" style="background: {c.darkest};"></div>
				<div class="cap-brim" style="background: {c.dark};"></div>
				<div class="cap-tassel" style="background: {c.light};"></div>
			</div>
		{/if}

		<!-- Body -->
		<div
			class="body"
			style="background: {c.body}; border-color: {c.dark}; box-shadow: inset 3px 3px 0 {c.light}, inset -2px -2px 0 {c.darkest};"
		>
			<!-- Eyes -->
			<div class="eyes">
				<div class="eye">
					<div class="pupil" style="background: {c.pupil};"></div>
				</div>
				<div class="eye">
					<div class="pupil" style="background: {c.pupil};"></div>
				</div>
			</div>

			<!-- Mouth with teeth -->
			<div class="mouth" style="background: #111111; border-color: {c.dark};">
				<div class="teeth-top">
					<div class="tooth"></div>
					<div class="tooth"></div>
					<div class="tooth"></div>
					<div class="tooth"></div>
					<div class="tooth"></div>
				</div>
				<div class="teeth-bottom">
					<div class="tooth"></div>
					<div class="tooth"></div>
					<div class="tooth"></div>
					<div class="tooth"></div>
				</div>
			</div>
		</div>

		<!-- Legs -->
		<div
			class="legs"
			class:legs-together={legState === 0 || legState === 2}
			class:legs-apart={legState === 1}
			class:legs-crossed={legState === 3}
		>
			<div class="leg leg-left" style="background: {c.body}; border-color: {c.dark};">
				<div class="foot" style="background: {c.body}; border-color: {c.dark};"></div>
			</div>
			<div class="leg leg-right" style="background: {c.body}; border-color: {c.dark};">
				<div class="foot" style="background: {c.body}; border-color: {c.dark};"></div>
			</div>
		</div>
	</div>
</div>

<style>
	.troggle-container {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		image-rendering: pixelated;
	}

	.troggle {
		position: relative;
		width: 70px;
		height: 68px;
	}

	/* ---- BODY ---- */
	.body {
		position: absolute;
		top: 8px;
		left: 5px;
		width: 60px;
		height: 44px;
		border-radius: 50% 50% 42% 42%;
		border: 2px solid;
		overflow: hidden;
	}

	/* ---- EYES ---- */
	.eyes {
		display: flex;
		justify-content: center;
		gap: 6px;
		margin-top: 6px;
	}

	.eye {
		width: 14px;
		height: 14px;
		background: #ffffff;
		border-radius: 50%;
		border: 1px solid #888888;
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
	}

	.pupil {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		position: absolute;
		bottom: 1px;
	}

	/* ---- MOUTH ---- */
	.mouth {
		position: absolute;
		bottom: 4px;
		left: 50%;
		transform: translateX(-50%);
		width: 34px;
		height: 14px;
		border-radius: 2px 2px 8px 8px;
		border: 1px solid;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		overflow: hidden;
	}

	.teeth-top,
	.teeth-bottom {
		display: flex;
		justify-content: space-around;
	}

	.teeth-top .tooth {
		width: 5px;
		height: 4px;
		background: #ffffff;
		border-radius: 0 0 1px 1px;
	}

	.teeth-bottom .tooth {
		width: 5px;
		height: 4px;
		background: #ffffff;
		border-radius: 1px 1px 0 0;
	}

	/* ---- LEGS ---- */
	.legs {
		position: absolute;
		bottom: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 30px;
		height: 18px;
		display: flex;
		justify-content: center;
		gap: 8px;
	}

	.leg {
		width: 6px;
		height: 12px;
		border: 1px solid;
		border-radius: 1px;
		position: relative;
		transition: transform 0.1s ease;
	}

	.foot {
		position: absolute;
		bottom: -3px;
		left: -2px;
		width: 10px;
		height: 4px;
		border: 1px solid;
		border-radius: 1px;
	}

	/* Leg animation states */
	.legs-together .leg-left {
		transform: translateX(0);
	}
	.legs-together .leg-right {
		transform: translateX(0);
	}

	.legs-apart .leg-left {
		transform: translateX(-5px) rotate(-8deg);
	}
	.legs-apart .leg-right {
		transform: translateX(5px) rotate(8deg);
	}

	.legs-crossed .leg-left {
		transform: translateX(3px) rotate(5deg);
	}
	.legs-crossed .leg-right {
		transform: translateX(-3px) rotate(-5deg);
	}

	/* ---- BASHFUL ANTENNAE ---- */
	.antenna {
		position: absolute;
		top: -2px;
		width: 2px;
		height: 14px;
		z-index: 1;
	}

	.antenna-left {
		left: 18px;
		transform: rotate(-15deg);
	}

	.antenna-right {
		right: 18px;
		transform: rotate(15deg);
	}

	.antenna-stalk {
		width: 2px;
		height: 10px;
	}

	.antenna-tip {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		margin-left: -2px;
		margin-top: -1px;
	}

	/* ---- HELPER SINGLE HORN ---- */
	.horn-single {
		position: absolute;
		top: -4px;
		left: 50%;
		transform: translateX(-50%);
		z-index: 1;
	}

	.horn-single .horn-shape {
		width: 0;
		height: 0;
		border-left: 6px solid transparent;
		border-right: 6px solid transparent;
		border-bottom: 14px solid;
	}

	/* ---- WORKER DEVIL HORNS ---- */
	.horn {
		position: absolute;
		top: -2px;
		z-index: 1;
	}

	.horn-left {
		left: 10px;
		transform: rotate(-20deg);
	}

	.horn-right {
		right: 10px;
		transform: rotate(20deg);
	}

	.horn .horn-shape {
		width: 0;
		height: 0;
		border-left: 4px solid transparent;
		border-right: 4px solid transparent;
		border-bottom: 12px solid;
	}

	/* ---- SMARTIE GRADUATION CAP ---- */
	.grad-cap {
		position: absolute;
		top: -4px;
		left: 50%;
		transform: translateX(-50%);
		z-index: 1;
	}

	.cap-top {
		width: 18px;
		height: 6px;
		margin: 0 auto;
		border-radius: 1px;
	}

	.cap-brim {
		width: 36px;
		height: 4px;
		margin-left: -9px;
		border-radius: 1px;
	}

	.cap-tassel {
		position: absolute;
		top: 2px;
		right: -8px;
		width: 2px;
		height: 10px;
		border-radius: 0 0 2px 2px;
	}
</style>
