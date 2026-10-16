<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { resolve } from '$app/paths';

	import maplibregl from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import { getStyledMap } from '$lib/map/baseLayer';
	import { getLotBounds } from '$lib/map/lotBoundaries';
	import { addGeolocateControl } from '$lib/map/controls';
	import Spiderfy from '@nazka/map-gl-js-spiderfy';
	import type { Feature, FeatureCollection, GeoJsonProperties } from 'geojson';

	import { controller } from './Controller.svelte';
	import { photoSrc } from './utilities/algorithms';

	const alpha = 1;
	const ICON_PREFIX: string = resolve('/icons/' as any);
	const CIRCLE_RADIUS = { unselected: 6, selected: 12 };
	const CIRCLE_COLOR = {
		unselected: `rgba(252, 141, 98, ${alpha})`,
		selected: `rgba(102, 194, 165, ${alpha})`
	};

	let geojson = $derived({
		type: 'FeatureCollection',
		features: controller.observations.map(
			(observation) =>
				({
					type: 'Feature',
					geometry: observation.geojson,
					properties: {
						id: observation.id,
						color: CIRCLE_COLOR.unselected,
						imageUrl: photoSrc(observation, 'large')
					}
				}) as Feature
		)
	} as FeatureCollection);

	// Image viewing

	let isImageViewing = $state(false);
	let imageUrl: string = $state('');

	const handleMarkerClick = (properties: GeoJsonProperties) => {
		imageUrl = properties!.imageUrl;
		controller.id = properties!.id;
		isImageViewing = false; // Reset to ensure transition restarts
		// Use a short timeout to allow a browser paint frame before showing the modal
		setTimeout(() => {
			isImageViewing = true;
		}, 20);
	};

	const closeZoom = () => {
		isImageViewing = false;
	};

	// Map
	let mapContainer: HTMLDivElement;
	let map: maplibregl.Map;
	let mapReady = $state(false);

	onMount(async () => {
		// Map style and bounds

		const style = await getStyledMap(true);
		const bounds = getLotBounds();

		// Map

		map = new maplibregl.Map({
			container: mapContainer,
			style: style,
			bounds: bounds
		});

		map.addControl(
			new maplibregl.NavigationControl({
				showZoom: true,
				showCompass: false
			})
		);
		addGeolocateControl(map);

		map.on('load', async () => {
			map.addSource('observations', {
				type: 'geojson',
				data: geojson,
				// Enable clustering
				cluster: true,
				clusterMaxZoom: 17,
				clusterRadius: 6
			});

			map.addLayer({
				id: 'observations-layer',
				type: 'circle', // or 'symbol' if using an icon image
				source: 'observations',
				paint: {
					// Sets a dynamic match statement looking at feature.properties.id
					'circle-radius': CIRCLE_RADIUS.unselected,
					'circle-color': CIRCLE_COLOR.unselected
				}
			});

			map.addLayer({
				id: 'observation-clusters',
				type: 'symbol',
				source: 'observations',
				filter: ['has', 'point_count'], // Only show clusters
				layout: {
					'icon-image': 'observation-cluster',
					'icon-allow-overlap': true
				},
				paint: { 'icon-color': 'white' }
			});

			map.addLayer({
				id: 'observation-markers',
				type: 'symbol',
				source: 'observations',
				filter: ['!has', 'point_count'], // Individual markers (not clusters)
				layout: {
					'icon-image': 'observation-cluster',
					'icon-allow-overlap': true
				},
				paint: {
					'icon-color': ['get', 'color']
				}
			});

			map.addLayer({
				id: 'observation-cluster-count',
				type: 'symbol',
				source: 'observations',
				filter: ['has', 'point_count'],
				layout: {
					'text-field': '{point_count}',
					'text-font': ['Arial Regular'],
					'text-size': 12,
					'text-allow-overlap': true
				},
				paint: {
					'text-color': '#000000'
				}
			});

			const { data: image } = await map.loadImage(
				`${ICON_PREFIX}circle-sdf.png`
			);
			map.addImage('observation-cluster', image, { sdf: true });

			const spiderfy = new Spiderfy(map, {
				onLeafClick: (feature) => handleMarkerClick(feature.properties),
				closeOnLeafClick: false,
				circleOptions: { leavesSeparation: 40 },
				spiderLeavesPaint: {
					'icon-color': ['get', 'color']
				}
			});
			spiderfy.applyTo('observation-clusters');

			map.on('click', (e) => {
				// Query for rendered features at the click point
				const features = map.queryRenderedFeatures(e.point, {
					layers: ['observation-markers'] // Check this layers
				});

				if (features.length > 0) {
					const feature = features[0]; // Get the top-most feature
					if (feature.properties && feature.properties.imageUrl) {
						// It's an individual observation marker
						handleMarkerClick(feature.properties);
						e.preventDefault();
					}
				}
			});

			// Event listener for clicking on image -- prevent default map interactions
			map.on('click', (e) => {
				if (isImageViewing) {
					e.preventDefault();
				}
			});

			// Change cursor when it enters an observation
			map.on('mouseenter', 'observations-layer', () => {
				map.getCanvas().style.cursor = 'pointer';
			});

			map.on('mouseleave', 'observations-layer', () => {
				map.getCanvas().style.cursor = '';
			});

			map.on('mouseenter', 'spiderfy-leaves-layer', () => {
				map.getCanvas().style.cursor = 'pointer';
			});

			// 2. Clear the canvas style modification when the cursor leaves the boundary profile
			map.on('mouseleave', 'spiderfy-leaves-layer', () => {
				map.getCanvas().style.cursor = '';
			});

			mapReady = true;
		});
	});

	onDestroy(() => {
		if (map) {
			map.remove();
		}
	});

	$effect(() => {
		if (mapReady && map && map.getSource('observations')) {
			const source = map.getSource('observations') as maplibregl.GeoJSONSource;
			if (source) source.setData(geojson);
		}
	});

	$effect(() => {
		const id = controller.id;

		if (mapReady && map) {
			// This overwrites the layer calculation layout entirely, forcing a canvas repaint
			map.setPaintProperty('observation-markers', 'icon-color', [
				'case',
				['==', ['get', 'id'], id ?? -1],
				CIRCLE_COLOR.selected,
				CIRCLE_COLOR.unselected
			]);
		}
	});
</script>

{#if controller.observations.length > 0}
	<p>
		Points on the map are the locations where an observer has made observations.
		Clicking on a point shows an image of the observation. The filmstrip scrolls
		to show the species name, observation date, and a link to the iNaturalist
		record. Click on the image to return to the map.
	</p>
{/if}

<div class="map-wrapper">
	<div id="map-container" class="map-container" bind:this={mapContainer}></div>
	<button
		type="button"
		class="modal-backdrop"
		class:active-backdrop={isImageViewing}
		onclick={closeZoom}
		aria-label="Close zoomed image"
	>
		{#if isImageViewing}
			<img src={imageUrl} alt="Observation" class="observation-image" />
		{/if}
	</button>
</div>

<style>
	.map-wrapper {
		position: relative; /* Context for the modal */
		width: min(800px, 100%);
		aspect-ratio: 1 / 1; /* Maintain 1:1 aspect ratio */
		margin-bottom: 1rem;
	}

	.map-container {
		overflow: hidden;
		width: 100%;
		height: 100%;
	}

	.modal-backdrop {
		position: absolute;
		inset: 0;
		z-index: 1000;
		background: rgba(0, 0, 0, 0.6);
		opacity: 0;
		visibility: hidden;
		pointer-events: none;
		border: none;
		padding: 0;
		margin: 0;
		display: block;
		width: 100%;
		height: 100%;
		transition: opacity 1s ease-in;
	}

	.modal-backdrop.active-backdrop {
		opacity: 1;
		visibility: visible;
		pointer-events: auto; /* Make clickable when active */
	}

	.observation-image {
		position: absolute;
		object-fit: cover;
		pointer-events: auto;
		top: 0 !important;
		left: 0 !important;
		width: 100% !important;
		height: 100% !important;
		border-radius: 0px;
	}
	/*
	.map-container {
		position: relative;
		width: 100%;
		max-width: 800px;
		aspect-ratio: 1;
		margin-bottom: 1rem;
	}*/
</style>
