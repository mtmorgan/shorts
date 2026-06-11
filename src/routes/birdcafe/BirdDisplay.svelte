<script lang="ts">
	import { onMount } from 'svelte';
	import { Button, Icon, ButtonGroup } from '@sveltestrap/sveltestrap';
	import { getBirdPhotos } from './iNaturalist';
	import type { TaxonPhoto, BirdDisplayProps } from './types';

	interface DisplayPhoto extends TaxonPhoto {
		id: number;
		name: string;
		animationState: 'visible-right' | 'animating-out' | 'hidden';
	}

	const DAILY_DURATION_MS = 30000;
	const PAUSE_DURATION_MS = 5000;

	let { birds }: BirdDisplayProps = $props();
	const allDates = Object.keys(birds);

	let status = $state({
		dateIndex: 0,
		birdIndex: 0,
		inIntroduction: true,
		isRunning: false
	});
	let abortController: AbortController | null;

	let statusMessages = $state({
		date: '',
		observations: '',
		progress: '',
		name: ''
	});
	let errorMessage = $state('');

	let activeImages = $state<DisplayPhoto[]>([]);
	let nextId = 0;

	// Navigation controls

	const resetBirdsToday = (dateIndex: number) => {
		abortController?.abort(); // This cancels the loop in progress
		abortController = null; // Nullify the controller
		activeImages = [];
		status = {
			dateIndex,
			birdIndex: 0,
			inIntroduction: true,
			isRunning: false
		};
		statusMessages = { date: '', observations: '', progress: '', name: '' };
	};

	const jumpTo = (dateIndex: number) => {
		resetBirdsToday(dateIndex);
		runDates();
	};

	const navigate = (direction: 'prev' | 'next') => {
		const delta = direction === 'next' ? 1 : -1;
		const dateIndex = Math.max(
			0,
			Math.min(status.dateIndex + delta, allDates.length - 1)
		);
		resetBirdsToday(dateIndex);
		runDates();
	};

	const togglePlay = () => {
		if (status.isRunning) {
			status.isRunning = false;
			abortController?.abort();
			abortController = null;
		} else {
			runDates();
		}
	};

	// Bird display

	const delay = (ms: number, signal: AbortSignal) =>
		new Promise((resolve, reject) => {
			const timeout = setTimeout(resolve, ms);
			signal.addEventListener('abort', () => {
				status.isRunning = false;
				clearTimeout(timeout);
				reject(new DOMException('Aborted', 'AbortError'));
			});
		});

	const formatBirdName = (name: string): string => {
		if (!name.includes(',')) return name;

		const [species, type] = name.split(',').map((s) => s.trim());
		return `${type} ${species}`;
	};

	const fetchAndDisplayBird = async (birdCommonName: string) => {
		if (!status.isRunning) return;
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
			console.error(`Failed to fetch '${birdCommonName}': ${error}`); // Log the error for debugging
			errorMessage = `'${birdCommonName}' ${error}`;
		}
	};

	const doIntroduction = async (
		today: string,
		birdsToday: string[],
		signal: AbortSignal
	) => {
		// Announce the date and number of observations
		statusMessages.date = today;
		statusMessages.observations = `${birdsToday.length} observations`;
		await delay(PAUSE_DURATION_MS, signal);
	};

	const doBird = async (birdsToday: string[], signal: AbortSignal) => {
		// Start bird display and delay before next
		const birdName = birdsToday[status.birdIndex];
		const interval = DAILY_DURATION_MS / birdsToday.length;

		statusMessages.name = formatBirdName(birdName);
		statusMessages.progress = `${status.birdIndex + 1} / ${birdsToday.length}`;
		await fetchAndDisplayBird(birdName);
		await delay(interval, signal);
	};

	// Iteration over birds and dates

	const runBirdsToday = async (today: string, signal: AbortSignal) => {
		const birdsToday = birds[today];
		if (!birdsToday) return;

		try {
			// Introduce the sequence?
			if (status.inIntroduction) {
				await doIntroduction(today, birdsToday, signal);
				status.inIntroduction = false;
			}

			// Continue the sequence
			while (status.birdIndex < birdsToday.length && status.isRunning) {
				await doBird(birdsToday, signal);
				if (signal.aborted) return;
				status.birdIndex += 1;
			}
		} catch (e) {
			return; // Exit immediately if aborted
		}

		// Update state for next date
		status.inIntroduction = true;
		status.birdIndex = 0;
	};

	const runDates = async () => {
		if (!navigator.onLine) {
			errorMessage =
				'No internet connection detected. Please check your network and try again.';
			return;
		}
		if (status.isRunning) return;

		abortController = new AbortController();
		const signal = abortController.signal;
		status.isRunning = true;

		while (status.dateIndex < allDates.length && status.isRunning) {
			await runBirdsToday(allDates[status.dateIndex], signal);
			if (signal.aborted) return;
			if (status.isRunning && status.dateIndex < allDates.length - 1) {
				status.dateIndex += 1;
			} else {
				break;
			}
		}

		status.dateIndex = 0;
		status.isRunning = false;
	};

	onMount(() => {
		const handleOnline = () => {
			errorMessage = '';
		};
		window.addEventListener('online', handleOnline);
		runDates();

		return () => {
			window.removeEventListener('online', handleOnline);
			activeImages = [];
		};
	});
</script>

<p>
	This animation displays pictures of each bird we've seen over {Object.keys(
		birds
	).length} days. Each day takes {DAILY_DURATION_MS / 1000} seconds to display (so
	about
	{Math.round(((DAILY_DURATION_MS / 1000) * Object.keys(birds).length) / 60)} minutes
	for all days); if we saw a lot of birds, they scroll by more quickly!
</p>

<ButtonGroup>
	<Button onclick={() => jumpTo(0)}>
		<Icon name="skip-start" />
	</Button>

	<Button onclick={() => navigate('prev')}>
		<Icon name="skip-backward" />
	</Button>

	<Button color="primary" onclick={togglePlay}>
		{#if status.isRunning}
			<Icon name="pause" />
		{:else}
			<Icon name="play" />
		{/if}
	</Button>

	<Button onclick={() => navigate('next')}>
		<Icon name="skip-forward" />
	</Button>

	<Button onclick={() => jumpTo(allDates.length - 1)}>
		<Icon name="skip-end" />
	</Button>
</ButtonGroup>

<div class="text-end">
	{#if status.inIntroduction}
		<div class="fw-bold">
			{statusMessages.date}
		</div>
		<div class="text-muted">
			{statusMessages.observations}
		</div>
	{:else}
		<div class="fw-bold">
			{statusMessages.progress}
		</div>
		<div class="text-muted">
			{statusMessages.name}
		</div>
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

<div class="mb-3 text-end">
	{#if errorMessage}
		<div class="invalid-feedback">{errorMessage}</div>
	{/if}
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
