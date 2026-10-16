<script lang="ts">
	import { Container, Row, Col } from '@sveltestrap/sveltestrap';
	import ObservationCard from './ObservationCard.svelte';
	import { controller } from './Controller.svelte';
</script>

{#if controller.observations.length > 0}
	<h3>Observations</h3>
	<p>
		Scroll through the filmstrip to see observations. Click on a frame to see
		the location of the image on the map. Click on the iNaturalist icon to visit
		the record for the observation.
	</p>

	<Container fluid class="py-4">
		<!-- Filmstrip Wrapper -->
		<div class="filmstrip-container">
			<Row class="flex-nowrap g-3">
				{#each controller.observations as observation}
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

	/* Optional custom scrollbar design */
	.filmstrip-container::-webkit-scrollbar {
		height: 8px;
	}
	.filmstrip-container::-webkit-scrollbar-thumb {
		background-color: #ccc;
		border-radius: 4px;
	}
	/* Define widths for your filmstrip frames */
	:global(.filmstrip-item) {
		width: 260px !important; /* Adjust item thickness */
		scroll-snap-align: start;
		display: inline-block;
	}
</style>
