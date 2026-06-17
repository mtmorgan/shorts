<script lang="ts">
	import type { AnimationController } from './AnimationController.svelte';
	import { filterBirdsToday, drawPunchCard } from './punchcard';
	import type { Birds } from './types';

	let { controller }: { controller: AnimationController } = $props();
	let chartContainer: HTMLDivElement | undefined = $state();
	let chartWidth = $state(0);

	const today = $derived(
		Object.keys(controller.birds)[controller.status.dateIndex]
	);
	const filteredBirds = $derived(filterBirdsToday(controller.birds, today));

	$effect(() => {
		// Access currentBird to establish a reactive dependency
		const currentToday = today;
		const currentBirds = filteredBirds;
		const bird = controller.currentBird?.name;
		if (chartContainer && currentBirds && currentToday) {
			drawPunchCard(
				chartContainer,
				currentBirds,
				currentToday,
				bird,
				chartWidth
			);
		}
	});
</script>

<div
	bind:this={chartContainer}
	class="punchcard-wrapper"
	bind:clientWidth={chartWidth}
></div>

<style>
	.punchcard-wrapper {
		width: 100%;
		overflow-x: auto;
		background: #ffffff;
		border: 1px dashed #ccc; /* Just to visualize the boundary */
		margin-top: 15px; /* Add some spacing */
	}
</style>
