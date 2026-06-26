<script lang="ts">
	import { AnimationController } from './AnimationController.svelte';
	import { drawAbundance } from './abundance';
	import AbundanceTable from './AbundanceTable.svelte';
	import type { BirdObservation, Birds } from './types';

	let { controller }: { controller: AnimationController } = $props();
	let chartContainer: HTMLDivElement | undefined = $state();
	let chartWidth = $state(0);

	const tallyObservations = (birds: Birds): BirdObservation[] => {
		const counts: Record<string, number> = {};
		for (const observations of Object.values(birds)) {
			for (const bird of observations) {
				counts[bird] = (counts[bird] || 0) + 1;
			}
		}
		return Object.entries(counts).map(([key, value]) => ({
			species: key,
			count: value
		}));
	};

	let counts = $derived(tallyObservations(controller.birds));

	$effect(() => {
		let counts_ = counts;
		if (chartContainer && counts) {
			drawAbundance(chartContainer, chartWidth, counts_);
		}
	});
</script>

<h2>Abundance</h2>

Abundance usually follows a 'power law': there are a lot of rarely heard birds,
and relative few regulars. The plot below shows this relationship.

<div
	bind:this={chartContainer}
	class="abundance-wrapper"
	bind:clientWidth={chartWidth}
></div>

<AbundanceTable {counts} />

<style>
	.abundance-wrapper {
		width: 100%;
		overflow-x: auto;
		background: #ffffff;
		border: 1px dashed #ccc; /* Just to visualize the boundary */
		margin-top: 15px; /* Add some spacing */
	}
</style>
