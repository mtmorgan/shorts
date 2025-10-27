<script lang="ts">
	import { resolve } from '$app/paths';
	import { onMount, onDestroy } from 'svelte';
	import { debounce } from 'lodash-es';
	import type { FileMap } from '$lib/types';
	import type { Feature, Polygon } from 'geojson';
	import MushroomSketch from '$lib/MushroomSketch.svelte';
	import 'leaflet/dist/leaflet.css';

	// Data

	// NOTE: 'as any' is a workaround to TypeScript issue with resolve()
	const IMAGE_PREFIX: string = resolve('/images/' as any);
	const mushroomsUrl: string = IMAGE_PREFIX + 'mushrooms.json';

	let data: FileMap[] = $state<FileMap[]>([]);
	// FIXME: I can't get reactivity on 'data' to work inside MushroomSketch
	let dataVersion = $state(0);

	// Fetch and filter data
	const fetchData = async (url: string) => {
		const reject = new Set(['IMG_2161.jpeg', 'IMG_5989.jpeg']);
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`HTTP error. Status: ${response.status}`);
		}
		const data: FileMap[] = await response.json();
		return data.filter((d: FileMap) => !reject.has(d.FileName));
	};

	// Map

	// Leaflet map variables
	let mapElement: HTMLDivElement;
	let leafletMap: L.Map;
	const lotColor = '#fc8d62';

	onMount(async () => {
		const L = await import('leaflet');
		data = await fetchData(mushroomsUrl);

		const topography = L.tileLayer(
			'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
			{
				attribution: 'See notes for attribution',
				crossOrigin: true
			}
		);

		const lotBoundaries: Feature<Polygon> = {
			type: 'Feature',
			properties: {
				name: 'Our Place'
			},
			geometry: {
				type: 'Polygon',
				coordinates: [
					[
						[-79.88031, 43.89948],
						[-79.8814, 43.89844],
						[-79.87843, 43.89613],
						[-79.87626, 43.89452],
						[-79.87114, 43.89904],
						[-79.87342, 43.90079],
						[-79.87692, 43.89754],
						[-79.88031, 43.89948]
					]
				]
			}
		};
		const lot = L.geoJSON(lotBoundaries, {
			style: {
				color: lotColor,
				weight: 1,
				fillOpacity: 0
			}
		});

		leafletMap = L.map(mapElement, {
			zoomSnap: 0,
			layers: [topography, lot]
		}).fitBounds(lot.getBounds());

		// Update p5 coordinates when the map moves or zooms
		const updateSketch = () => {
			data.forEach((d) => {
				const point = leafletMap.latLngToContainerPoint(
					[d.GPSLatitude, d.GPSLongitude]
				);
				d.x = point.x;
				d.y = point.y;
			})
			dataVersion += 1;
		};
		const debouncedUpdateSketch = debounce(updateSketch, 150); // 150ms delay

		leafletMap.on('zoom drag move', debouncedUpdateSketch);
		updateSketch(); // Initialize the bounds once
	});

	onDestroy(() => {
		// Clean up Leaflet to prevent memory leaks
		if (leafletMap) {
			leafletMap.remove();
		}
	});
</script>

<div class="map-container" bind:this={mapElement}>
	<!-- This is the container for the Leaflet map, sketch inside it -->
	<MushroomSketch {data} {IMAGE_PREFIX} {dataVersion} />
</div>

<style>
	.map-container {
		position: relative;
		width: min(800px, 100%);
		aspect-ratio: 1 / 1;
		margin-bottom: 1rem;
	}
	/* Make sure the Leaflet container has a lower z-index */
	:global(.leaflet-pane) {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	}
</style>
