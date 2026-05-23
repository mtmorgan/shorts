<script lang="ts">
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import type { FileMap } from './types';
	import {
		Carousel,
		CarouselControl,
		CarouselItem
	} from '@sveltestrap/sveltestrap';

	// Data
	const IMAGE_PREFIX: string = resolve('/images/' as any);
	const mushroomsUrl: string = IMAGE_PREFIX + 'mushrooms.json';

	// State
	let metadata: FileMap[] = []; // All metadata
	let metadataLoaded = $state(false);
	let items: (string | null)[] = $state([]); // URLs for displayed images
	let activeIndex = $state(0);

	// Fetch metadata
	const fetchMetadata = async () => {
		const reject = new Set(['IMG_2161.jpeg', 'IMG_5989.jpeg']);
		try {
			const response = await fetch(mushroomsUrl);
			if (!response.ok) {
				throw new Error(`HTTP error. Status: ${response.status}`);
			}
			const data = await response.json();
			metadata = data.filter((d: FileMap) => !reject.has(d.FileName));
			items = new Array(metadata.length).fill(null);
			metadataLoaded = true; // Mark metadata as loaded
		} catch (error) {
			console.error('Failed to fetch mushroom metadata:', error);
		}
	};

	// Fetch a specific image URL when needed
	const fetchImageForIndex = (index: number) => {
		if (metadata.length > index && items[index] === null) {
			items[index] = IMAGE_PREFIX + metadata[index].FileName;
		}
	};

	onMount(async () => {
		await fetchMetadata();
	});

	// Watch for changes in activeIndex and set the image URL
	$effect(() => {
		if (metadataLoaded) {
			fetchImageForIndex(activeIndex);
		}
	});
</script>

<p>
	The carousel below walks through the mushrooms. It's not as much fun as
	clicking on the dots in the map.
</p>

{#if items.length > 0}
	<Carousel {items} bind:activeIndex>
		<div class="carousel-inner">
			{#each items as _, index}
				<CarouselItem bind:activeIndex itemIndex={index}>
					{#if items[index]}
						<img src={items[index]} alt="Mushroom {index + 1}" />
					{:else}
						<!-- Placeholder while image is loading -->
						<div class="placeholder">Loading mushroom {index + 1}...</div>
					{/if}
				</CarouselItem>
			{/each}
		</div>
		<CarouselControl direction="prev" bind:activeIndex {items} />
		<CarouselControl direction="next" bind:activeIndex {items} />
	</Carousel>
{:else}
	<!-- Placeholder while data is being fetched -->
	<div class="placeholder">Loading mushrooms...</div>
{/if}

<style>
	/* Apply the core dimensions and box styles to the outer wrapper */
	:global(.carousel) {
		width: min(800px, 100%);
		aspect-ratio: 1 / 1;
		margin-bottom: 1rem;
		height: auto;
		border-radius: 4px;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);

		/* Forces the border-radius to cut off the corners of sliding images */
		overflow: hidden;
	}

	/* Force the inner track and items to fill the 1:1 container */
	:global(.carousel-inner),
	:global(.carousel-item) {
		width: 100%;
		height: 100%;
	}

	/* Style the images inside to fill the square space cleanly */
	:global(.carousel-item img) {
		width: 100%;
		height: 100%;
		/* 'cover' ensures the image fills the 1:1 ratio without squishing.
       Use 'contain' if you don't want any cropping. */
		object-fit: cover;
	}

	.placeholder {
		width: 100%;
		height: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		background-color: #f0f0f0;
		color: #888;
		font-style: italic;
	}
</style>
