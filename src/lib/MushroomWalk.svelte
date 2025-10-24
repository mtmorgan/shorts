<script lang="ts">
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import type { FileMap } from '$lib/types';

	// Data

	const IMAGE_PREFIX: string = resolve('/images/' as any);
	const mushroomsUrl: string = IMAGE_PREFIX + 'mushrooms.json';

	// Fetch and filter data
	let data: FileMap[] = $state([]);
	let images: string[] = $state([]);
	let currentIndex: number = $state(0);
	let isLoading: boolean = $state(true);

	const fetchData = async (url: string) => {
		const reject = new Set(['IMG_2161.jpeg', 'IMG_5989.jpeg']);
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`HTTP error. Status: ${response.status}`);
		}
		data = await response.json();
		data.filter((d: FileMap) => !reject.has(d.FileName));
		images = data.map((d: FileMap) => IMAGE_PREFIX + d.FileName);
		isLoading = false;
	};

	onMount(async () => {
		fetchData(mushroomsUrl);
	});

	// Function to move to the next image.
	function nextImage() {
		currentIndex = (currentIndex + 1) % images.length;
	}

	// Function to move to the previous image.
	function previousImage() {
		currentIndex = (currentIndex - 1 + images.length) % images.length;
	}
</script>

<div class="gallery-container">
	{#if isLoading}
		<p>Loading images...</p>
	{:else if images.length > 0}
		<div class="controls">
			<button onclick={previousImage}>&lt;</button>
			<input
				type="range"
				min="0"
				max={images.length - 1}
				bind:value={currentIndex}
			/> {currentIndex + 1} / {images.length}
			<button onclick={nextImage}>&gt;</button>
		</div>

		<div class="image-display">
			<!-- Use the reactive `currentIndex` to display the correct image -->
			<img
				src={images[currentIndex]}
				alt={`Mushroom gallery image ${data[currentIndex].FileName}`}
			/>
		</div>
	{:else}
		<p>No images found.</p>
	{/if}
</div>

<style>
  .gallery-container {
    display: flex;
    flex-direction: column;
    align-items: left;
    gap: 1rem;
    padding: 1em 0em;
  }

  .image-display img {
    max-width: 800px;
    width: 100%;
    height: auto;
    border-radius: 4px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  .controls {
    display: flex;
    gap: 1rem;
    align-items: center;
  }
</style>
