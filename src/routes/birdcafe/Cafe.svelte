<script lang="ts">
	import { getBirdPhotos } from './iNaturalist';
	import type { TaxonPhoto } from './types';
	import type { AnimationController } from './AnimationController.svelte';

	interface DisplayPhoto extends TaxonPhoto {
		id: number;
		name: string;
		animationState: 'visible-right' | 'animating-out' | 'hidden';
	}

	let { controller }: { controller: AnimationController } = $props();

	let activeImages = $state<DisplayPhoto[]>([]);
	let nextId = 0;

	const fetchAndDisplayBird = async (birdCommonName: string, runId: number) => {
		if (!controller.status.isRunning || runId !== controller.getActiveRunId())
			return;
		try {
			const photoData = await getBirdPhotos(birdCommonName);
			if (!controller.status.isRunning || runId !== controller.getActiveRunId())
				return;

			const newImage: DisplayPhoto = $state({
				...photoData,
				id: nextId++,
				name: birdCommonName,
				animationState: 'visible-right'
			});
			activeImages.push(newImage);
			setTimeout(() => {
				newImage.animationState = 'animating-out';
			}, 250);
			setTimeout(() => {
				newImage.animationState = 'hidden';
				activeImages = activeImages.filter((img) => img.id !== newImage.id);
			}, 10000);
		} catch (error) {
			console.error(`Failed to fetch '${birdCommonName}': ${error}`);
			controller.errorMessage = `'${birdCommonName}' ${error}`;
		}
	};

	// Svelte 5 reactive effect driven by currentBird changes from the controller
	$effect(() => {
		const bird = controller.currentBird;
		if (bird && controller.status.isRunning) {
			fetchAndDisplayBird(bird.name, bird.runId);
		}
	});

	// Clear any active images when the controller is explicitly reset (currentBird is set to null)
	$effect(() => {
		if (controller.currentBird === null) {
			activeImages = [];
		}
	});
</script>

<div class="animation-boundary">
	{#each activeImages as img (img.id)}
		{#if img.animationState !== 'hidden'}
			<div
				class="image-wrapper"
				class:visible-right={img.animationState === 'visible-right'}
				class:animating-out={img.animationState === 'animating-out'}
			>
				{#if img.medium_url}
					<img
						src={img.medium_url}
						alt="Dynamically loaded"
						class="img-fluid rounded-top"
					/>
				{/if}
				<div class="photo-info p-2 bg-dark text-white">
					<p class="mb-0" style="font-size: 0.65rem;">
						{img.name}
						{img.attribution}
					</p>
				</div>
			</div>
		{/if}
	{/each}
</div>

<style>
	/* Styling for the container that holds the image */
	.animation-boundary {
		position: relative; /* Crucial for absolute positioning inside */
		overflow: hidden; /* Hides anything that goes outside these bounds */
		width: 100%; /* Occupy available width */
		height: 290px; /* Example height, adjust as needed to give space for animation */
		border: 1px dashed #ccc; /* Just to visualize the boundary */
		margin-top: 15px; /* Add some spacing */
	}

	.image-wrapper {
		position: absolute;
		top: 50%; /* Vertically center (adjust as needed) */
		transform: translateY(-50%); /* Fine-tune vertical centering */
		width: 300px; /* Set a fixed width for the image container */
		max-width: 50%; /* Ensure it doesn't overflow on smaller screens */
		z-index: 10; /* Ensure it appears above other content */
		opacity: 0%;
		transition: opacity 0.25s ease-in-out; /* Smooth fade-in/out */
	}

	/* Initial state: Visible on the right */
	.image-wrapper.visible-right {
		right: 0px; /* Position it near the right edge */
		opacity: 1; /* Make it visible */
	}

	/* State for sliding off to the left */
	.image-wrapper.animating-out {
		right: 0px; /* Start from the right-aligned position */
		opacity: 1;
		/* Use keyframes for the actual slide-out */
		animation: slideLeft 10s forwards linear; /* 5s for the slide */
	}

	/* Re-implementing animation using keyframes for precise control */
	@keyframes slideLeft {
		from {
			transform: translate(0, -50%); /* Start at its visible position */
			opacity: 1;
		}
		to {
			transform: translate(-100vw, -50%); /* Move completely off-screen left */
			opacity: 0.25; /* Fade out */
		}
	}

	.image-wrapper img {
		display: block;
		width: 100%;
		height: auto;
		pointer-events: none; /* Prevents image from interfering with clicks on elements behind it */
	}
</style>
