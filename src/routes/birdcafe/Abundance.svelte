<script lang="ts">
	import { AnimationController } from './AnimationController.svelte';
	import { drawAbundance } from './abundance';

	let { controller }: { controller: AnimationController } = $props();
	let chartContainer: HTMLDivElement | undefined = $state();
	let chartWidth = $state(0);

	$effect(() => {
		const birds = controller.birds;
		if (chartContainer && birds) {
			drawAbundance(chartContainer, chartWidth, birds);
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

<style>
	.abundance-wrapper {
		width: 100%;
		overflow-x: auto;
		background: #ffffff;
		border: 1px dashed #ccc; /* Just to visualize the boundary */
		margin-top: 15px; /* Add some spacing */
	}
</style>
