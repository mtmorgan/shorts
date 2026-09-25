<script lang="ts">
	import { Container, Row, Col } from '@sveltestrap/sveltestrap';
	import type { ObservationResult } from './utilities/queries';
	import ObservationCard from './ObservationCard.svelte';

	let { observations }: { observations: ObservationResult[] } = $props();
</script>

{#if observations.length > 0}
	<h3>Observations</h3>

	<Container fluid class="py-4">
		<!-- Filmstrip Wrapper -->
		<div class="filmstrip-container">
			<Row class="flex-nowrap g-3">
				{#each observations as observation}
					<Col xs="auto" class="filmstrip-item">
						<ObservationCard {observation} />
					</Col>
				{/each}
			</Row>
		</div>
	</Container>
{/if}

<style>
	/* Enable horizontal scrolling and hide default scrollbars if desired */
	.filmstrip-container {
		overflow-x: auto;
		white-space: nowrap;
		scroll-snap-type: x mandatory;
		padding-bottom: 15px; /* Spacing for scrollbar visibility */
		-webkit-overflow-scrolling: touch;
	}

	/* Define widths for your filmstrip frames */
	:global(.filmstrip-item) {
		width: 260px; /* Adjust item thickness */
		scroll-snap-align: start;
		display: inline-block;
	}

	:global(.filmstrip-img) {
		height: 160px;
		object-fit: cover;
	}

	/* Optional custom scrollbar design */
	.filmstrip-container::-webkit-scrollbar {
		height: 8px;
	}
	.filmstrip-container::-webkit-scrollbar-thumb {
		background-color: #ccc;
		border-radius: 4px;
	}
</style>
