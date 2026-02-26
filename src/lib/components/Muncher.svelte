<script lang="ts">
	let {
		isMoving = false,
		isEating = false,
		isDying = false,
		facing = 'right' as 'up' | 'down' | 'left' | 'right',
		animFrame = 0
	} = $props();

	let flipX = $derived(facing === 'left' || facing === 'up');
	let src = $derived(isEating ? '/sprites/muncher-open.svg' : '/sprites/muncher-closed.svg');
</script>

<div class="muncher-container" style="image-rendering: auto;">
	<!-- Outer div handles flip only -->
	<div class="muncher-flip" style="transform: {flipX ? 'scaleX(-1)' : 'scaleX(1)'};">
		<!-- Inner div handles animations -->
		<div
			class="muncher-sprite"
			class:muncher-walk={isMoving && !isDying}
			class:muncher-dying={isDying}
			class:muncher-eat={isEating}
		>
			<img {src} alt="Muncher" class="muncher-img" draggable="false" />
		</div>
	</div>
</div>

<style>
	.muncher-container {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
	}

	.muncher-flip {
		transform-origin: center center;
	}

	.muncher-sprite {
		width: 80px;
		height: 68px;
		transform-origin: center center;
	}

	.muncher-img {
		width: 100%;
		height: 100%;
		display: block;
	}

	.muncher-walk {
		animation: muncher-bob 0.3s ease-in-out infinite;
	}

	.muncher-eat {
		animation: muncher-chomp 0.25s ease-out;
	}

	.muncher-dying {
		animation: muncher-death 0.8s ease-out forwards;
	}

	@keyframes muncher-bob {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-3px);
		}
	}

	@keyframes muncher-chomp {
		0% {
			transform: scale(1, 1);
		}
		30% {
			transform: scale(1.1, 0.9);
		}
		60% {
			transform: scale(0.95, 1.05);
		}
		100% {
			transform: scale(1, 1);
		}
	}

	@keyframes muncher-death {
		0% {
			transform: scale(1, 1);
			opacity: 1;
		}
		30% {
			transform: scale(1.3, 0.4);
			opacity: 1;
		}
		60% {
			transform: scale(1.5, 0.2);
			opacity: 0.7;
		}
		100% {
			transform: scale(0.1, 0.1);
			opacity: 0;
		}
	}
</style>
