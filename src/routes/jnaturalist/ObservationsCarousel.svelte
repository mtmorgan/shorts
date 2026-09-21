<script lang="ts">
	import {
		Carousel,
		CarouselControl,
		CarouselItem
	} from '@sveltestrap/sveltestrap';
	import type { ObservationResult } from './utilities/queries';

	let { observations }: { observations: ObservationResult[] } = $props();
	let activeIndex = $state(0);
</script>

{#if observations.length > 0}
	<h3>Observations</h3>
	{#if observations.length > 0}
		<Carousel items={observations} bind:activeIndex>
			<div class="carousel-inner">
				{#each observations as _, index}
					<CarouselItem bind:activeIndex itemIndex={index}>
						{#if observations[index]}
							<img
								src={observations[index].observation_photos[0].photo.url}
								alt="Observation {index + 1}"
							/>
						{:else}
							<!-- Placeholder while image is loading -->
							<div class="placeholder">Loading observation {index + 1}...</div>
						{/if}
					</CarouselItem>
				{/each}
			</div>
			<CarouselControl direction="prev" bind:activeIndex items={observations} />
			<CarouselControl direction="next" bind:activeIndex items={observations} />
		</Carousel>
	{:else}
		<!-- Placeholder while data is being fetched -->
		<div class="placeholder">Loading mushrooms...</div>
	{/if}
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
