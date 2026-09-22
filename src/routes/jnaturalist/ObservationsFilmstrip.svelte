<script lang="ts">
	import {
		Container,
		Row,
		Col,
		Card,
		CardImg,
		CardBody,
		CardTitle,
		CardText
	} from '@sveltestrap/sveltestrap';
	import type { ObservationResult } from './utilities/queries';

	let { observations }: { observations: ObservationResult[] } = $props();
</script>

{#if observations.length > 0}
	<h3>Observations</h3>

	<Container fluid class="py-4">
		<!-- Filmstrip Wrapper -->
		<div class="filmstrip-container">
			<Row class="flex-nowrap g-3">
				{#each observations as observation}
					{@const src = observation.observation_photos[0].photo.url.replace(
						'square.jpg',
						'small.jpg'
					)}
					<Col xs="auto" class="filmstrip-item">
						<Card class="h-100 shadow-sm">
							<CardImg
								top
								{src}
								alt={observation.taxon.name}
								class="filmstrip-img"
							/>
							<CardBody class="p-2 w-100" style="min-width: 0;">
								<p
									class="m-0 text-break"
									style="white-space: normal;"
									title={observation.taxon.name}
								>
									<span class="fst-italic">{observation.taxon.name}</span>
									({observation.taxon.preferred_common_name?.toLowerCase()})
									observed on
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
