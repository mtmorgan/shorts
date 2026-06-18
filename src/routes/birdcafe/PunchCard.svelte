<script lang="ts">
	import type { AnimationController } from './AnimationController.svelte';
	import { punchPointsToday, drawPunchCard } from './punchcard';
	import type { Birds } from './types';

	let { controller }: { controller: AnimationController } = $props();
	let chartContainer: HTMLDivElement | undefined = $state();
	let chartWidth = $state(0);

	const today = $derived(
		Object.keys(controller.birds)[controller.status.dateIndex]
	);
	const punchPoints = $derived(punchPointsToday(controller.birds, today));

	$effect(() => {
		// Access today and punchPoints to establish a reactive dependency
		const currentToday = today;
		const currentPunchPoints = punchPoints;
		if (chartContainer && currentToday && currentPunchPoints) {
			drawPunchCard(
				chartContainer,
				chartWidth,
				punchPoints,
				today,
				controller.birds[today],
				controller.currentBird?.name
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
