<script lang="ts">
	import { onMount } from 'svelte';
	import { Button, Input, FormGroup, Label } from '@sveltestrap/sveltestrap';
	import { getBirdPhotos } from './iNaturalist';
	import type { TaxonPhoto, Birds, BirdDisplayProps } from './types';

	interface DisplayPhoto extends TaxonPhoto {
		id: number;
		name: string;
		animationState: 'visible-right' | 'animating-out' | 'hidden';
	}

	let { birds }: BirdDisplayProps = $props();
	let selectedDate = $state(Object.keys(birds)[0]);
	let birdCommonName = $state('');
	let activeImages = $state<DisplayPhoto[]>([]);
	let nextId = 0;
	let status = $state({ date: '', progress: '', name: '' });
	let isRunning = $state(false);
	let errorMessage = $state('');

	const formatBirdName = (name: string): string => {
		if (!name.includes(',')) return name;

		const [species, type] = name.split(',').map((s) => s.trim());
		return `${type} ${species}`;
	};

	const fetchAndDisplayImage = async (birdCommonName: string) => {
		errorMessage = '';
		try {
			const photoData = await getBirdPhotos(birdCommonName);
			const newImage: DisplayPhoto = $state({
				...photoData,
				id: nextId++,
				name: formatBirdName(birdCommonName),
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
			console.error('Failed to fetch bird photos:', error); // Log the error for debugging
			errorMessage = error as string;
		}
	};

	const runSequenceForDate = async (date: string) => {
		const list = birds[date];
		if (!list) return;

		const TOTAL_DURATION_MS = 60000;
		const interval = TOTAL_DURATION_MS / list.length;

		for (let i = 0; i < list.length; i++) {
			birdCommonName = list[i];
			status.progress = `${i + 1} / ${list.length}`;
			status.name = formatBirdName(birdCommonName);
			await fetchAndDisplayImage(birdCommonName);
			await new Promise((resolve) => setTimeout(resolve, interval));
		}
		status.progress = '';
		status.name = '';
	};

	const runAllDates = async () => {
		isRunning = true;
		try {
			const allDates = Object.keys(birds);

			for (const date of allDates) {
				status.date = date;
				status.name = `${birds[date].length} observations`;
				await new Promise((resolve) => setTimeout(resolve, 10000));
				status.date = '';
				await runSequenceForDate(date);
			}
		} finally {
			isRunning = false;
		}
	};

	// Clean up the timeouts when the component is unmounted
	onMount(() => {
		return () => {
			// FIXME: zero activeImages
		};
	});
</script>

<div class="container mt-4">
	<div class="d-flex justify-content-between align-items-center mb-3">
		<Button color="primary" disabled={isRunning} on:click={runAllDates}
			>Start</Button
		>
		<div class="text-end">
			{#if status.date || status.progress}
				<div class="fw-bold">
					{status.date}
					{status.progress}
				</div>
				<div class="text-muted">
					{status.name}
				</div>
			{/if}
		</div>
	</div>

	<div class="mb-3 text-end">
		{#if errorMessage}
			<div class="invalid-feedback">{errorMessage}</div>
		{/if}
	</div>

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
							class="img-fluid rounded"
						/>
					{/if}
					<div class="photo-info p-2 bg-dark text-white">
						<p class="mb-0 small fw-bold">
							{img.name}
							{img.attribution}
						</p>
					</div>
				</div>
			{/if}
		{/each}
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
