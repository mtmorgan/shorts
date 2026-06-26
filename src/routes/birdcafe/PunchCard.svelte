<script lang="ts">
	import type { AnimationController } from './AnimationController.svelte';
	import {
		countBirdsPerDay,
		punchBirdsToday,
		drawPunchCard
	} from './punchcard';

	let { controller }: { controller: AnimationController } = $props();
	let chartContainer: HTMLDivElement | undefined = $state();
	let chartWidth = $state(0);

	const today = $derived(
		Object.keys(controller.birds)[controller.status.dateIndex]
	);
	const counts = $derived(countBirdsPerDay(controller.birds));
	const punches = $derived(punchBirdsToday(controller.birds, today));

	$effect(() => {
		// Access today and punchPoints to establish a reactive dependency
		const currentToday = today;
		const currentPunchPoints = punches;
		if (
			chartContainer &&
			currentToday &&
			currentPunchPoints &&
			controller.birds
		) {
			drawPunchCard(
				chartContainer,
				chartWidth,
				counts,
				punches,
				today,
				controller.birds,
				controller.currentBird?.name
			);
		}
	});
</script>

<h2>Punch Cards</h2>

<p>
	The bar chart at the top of the figure shows how many species were observed on
	each day. The punch card summarizes birds showing up on the day currently in
	the cafe, and the other days when the same species appeared.
</p>
<div
	bind:this={chartContainer}
	class="punchcard-wrapper"
	bind:clientWidth={chartWidth}
></div>

<p>
	Pan left or right if not all dates show. Hover over a y-axis label or 'punch'
	to see the species name and date.
</p>

<style>
	.punchcard-wrapper {
		width: 100%;
		overflow-x: auto;
		background: #ffffff;
		border: 1px dashed #ccc; /* Just to visualize the boundary */
		margin-top: 15px; /* Add some spacing */
	}
</style>
