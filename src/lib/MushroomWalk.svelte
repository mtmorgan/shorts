<script lang="ts">
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import type { FileMap } from '$lib/types';
	import {
		Carousel,
		CarouselControl,
		CarouselItem
	} from '@sveltestrap/sveltestrap';

	// Data

	const IMAGE_PREFIX: string = resolve('/images/' as any);
	const mushroomsUrl: string = IMAGE_PREFIX + 'mushrooms.json';

	// Fetch and filter data
	let data: FileMap[] = $state([]);
	let items: string[] = $state([]);
	let activeIndex = $state(0);

	const fetchData = async (url: string) => {
		const reject = new Set(['IMG_2161.jpeg', 'IMG_5989.jpeg']);
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`HTTP error. Status: ${response.status}`);
		}
		data = await response.json();
		data.filter((d: FileMap) => !reject.has(d.FileName));
		items = data.map((d: FileMap) => IMAGE_PREFIX + d.FileName);
	};

	onMount(async () => {
		await fetchData(mushroomsUrl);
	});
</script>

<p>
	The carousel below walks through the mushrooms. It's not as much fun as
	clicking on the dots in the map.
</p>

<Carousel {items} bind:activeIndex>
	<div class="carousel-inner">
		{#each items as item, index}
			<CarouselItem bind:activeIndex itemIndex={index}>
				<img src={item} alt="{item} {index + 1}" />
			</CarouselItem>
		{/each}
	</div>
	<CarouselControl direction="prev" bind:activeIndex {items} />
	<CarouselControl direction="next" bind:activeIndex {items} />
</Carousel>

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
</style>
