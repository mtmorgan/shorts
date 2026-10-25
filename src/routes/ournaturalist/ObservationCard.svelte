<script lang="ts">
	import { Card, CardImg, CardBody } from '@sveltestrap/sveltestrap';
	import { controller } from './Controller.svelte';
	import type { ObservationResult } from './utilities/queries';
	import { photoSrc } from './utilities/algorithms';
	import { tick } from 'svelte';

	let { observation }: { observation: ObservationResult } = $props();
	let src = $derived(photoSrc(observation, 'small'));

	let cardRef = $state({} as HTMLDivElement);
	let isSelected = $derived(controller.id === observation.id);

	$effect(() => {
		if (isSelected && cardRef) {
			tick().then(() => {
				cardRef.scrollIntoView({
					behavior: 'smooth',
					block: 'nearest',
					inline: 'start'
				});
			});
		}
	});
</script>

<div
	bind:this={cardRef}
	class="card-wrapper {isSelected ? 'selected-highlight' : ''}"
	onclick={() => (controller.id = observation.id)}
	role="presentation"
>
	<Card class="h-100 shadow-sm">
		<CardImg
			top
			{src}
			alt={observation.taxon.name}
			class="filmstrip-img"
			loading="lazy"
			decoding="async"
		/>
		<CardBody class="p-2 w-100" style="min-width: 0;">
			<p
				class="m-0 text-break"
				style="white-space: normal;"
				title={observation.taxon.name}
			>
				<span class="fst-italic">{observation.taxon.name}</span>
				({observation.taxon.preferred_common_name?.toLowerCase()}),
				{new Date(observation.observed_on_string).toDateString()}
				<a
					href="https://www.inaturalist.org/observations/{observation.id}"
					target="_blank"
					rel="noopener noreferrer"
					><img
						alt="iNaturalist"
						src="https://github.com/inaturalist/inaturalist/blob/main/app/assets/images/bird.png?raw=true"
						style="height: .9lh; width: auto; vertical-align: text-bottom;"
					/></a
				>.
			</p>
		</CardBody>
	</Card>
</div>

<style>
	:global(.filmstrip-img) {
		height: 160px;
		object-fit: cover;
	}

	.card-wrapper {
		flex: 0 0 auto;
		transition: transform 0.2s ease-in-out;
	}

	.selected-highlight {
		outline: 2px solid #4a90e2;
	}
</style>
