<script lang="ts">
	import { onMount } from 'svelte';
	import { Button, Input, FormGroup, Label } from '@sveltestrap/sveltestrap';
	import { getBirdPhotos } from './iNaturalist';

	let birdCommonName = '';
	let imageUrl = '';
	let showImage = false;
	let animationState = 'hidden';
	let timeoutId: number = 0;
	let errorMessage = '';

	// // Replace with your desired image URL
	// const FETCH_IMAGE_URL =
	// 	'https://via.placeholder.com/300x200.png?text=Fetched+Image';

	const fetchAndDisplayImage = async () => {
		errorMessage = '';
		try {
			const photoData = await getBirdPhotos(birdCommonName);
			imageUrl = photoData.medium_url;
			showImage = true;
			animationState = 'visible-right';
		} catch (error) {
			console.error('Failed to fetch bird photos:', error); // Log the error for debugging
			errorMessage = error;
			imageUrl = ''; // Clear any previous image
			showImage = false; // Hide image if there was an error
			animationState = 'hidden';
		}

		// Clear any existing timeout to prevent multiple timers running
		if (timeoutId) {
			clearTimeout(timeoutId);
		}

		// Set a timeout to start the slide-out animation after a short delay
		// This delay allows the image to first appear on the right
		timeoutId = setTimeout(() => {
			animationState = 'animating-out'; // Trigger the slide-out animation
		}, 250); // Small delay (0.5 seconds) to let it settle on the right

		// Set another timeout to fully remove the image after animation duration
		timeoutId = setTimeout(() => {
			animationState = 'hidden'; // Reset to hidden
			imageUrl = '';
			birdCommonName = ''; // Optionally clear the input
		}, 5000); // Total duration including initial display + animation
	};

	// Clean up the timeout when the component is unmounted
	// This is good practice to prevent memory leaks
	onMount(() => {
		return () => {
			if (timeoutId) {
				clearTimeout(timeoutId);
			}
		};
	});
</script>

<div class="container mt-4">
	<FormGroup>
		<Label for="imageUrlInput">Common name:</Label>
		<Input
			type="text"
			id="birdCommonName"
			placeholder="e.g., Blue Jay"
			bind:value={birdCommonName}
			invalid={!!errorMessage}
		/>
		{#if errorMessage}
			<div class="invalid-feedback">{errorMessage}</div>
		{/if}
	</FormGroup>

	<Button
		color="primary"
		on:click={fetchAndDisplayImage}
		disabled={!birdCommonName.trim()}
	>
		Load Image
	</Button>

	<div class="animation-boundary">
		{#if animationState !== 'hidden'}
			<div
				class="image-wrapper"
				class:visible-right={animationState === 'visible-right'}
				class:animating-out={animationState === 'animating-out'}
			>
				{#if imageUrl}
					<img
						src={imageUrl}
						alt="Dynamically loaded"
						class="img-fluid rounded"
					/>
				{/if}
			</div>
		{/if}
	</div>
</div>

<style>
	.invalid-feedback {
		display: block;
	}

	/* Styling for the container that holds the image */
	.animation-boundary {
		position: relative; /* Crucial for absolute positioning inside */
		overflow: hidden; /* Hides anything that goes outside these bounds */
		width: 100%; /* Occupy available width */
		height: 300px; /* Example height, adjust as needed to give space for animation */
		border: 1px dashed #ccc; /* Just to visualize the boundary */
		margin-top: 15px; /* Add some spacing */
	}

	.image-wrapper {
		position: absolute;
		top: 50%; /* Vertically center (adjust as needed) */
		transform: translateY(-50%); /* Fine-tune vertical centering */
		width: 300px; /* Set a fixed width for the image container */
		max-width: 90%; /* Ensure it doesn't overflow on smaller screens */
		z-index: 10; /* Ensure it appears above other content */
		opacity: 0%;
		transition: opacity 0.5s ease-in-out; /* Smooth fade-in/out */
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
		animation: slideLeft 5s forwards linear; /* 5s for the slide */
	}

	/* Re-implementing animation using keyframes for precise control */
	@keyframes slideLeft {
		from {
			transform: translate(0, -50%); /* Start at its visible position */
			opacity: 1;
		}
		to {
			transform: translate(-100vw, -50%); /* Move completely off-screen left */
			opacity: 0.5; /* Fade out */
		}
	}

	.image-wrapper img {
		display: block;
		width: 100%;
		height: auto;
		pointer-events: none; /* Prevents image from interfering with clicks on elements behind it */
	}
</style>
