<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import 'leaflet/dist/leaflet.css';

	// Leaflet map and p5 sketch variables
	let mapElement: HTMLDivElement;
	let leafletMap: L.Map;

	// Common map elements

	const lotColor = '#fc8d62';
	let resizeObserver: ResizeObserver;

	onMount(async () => {
		const L = await import('leaflet');

		const image = L.tileLayer(
			'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
			{
				attribution:
					'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
				crossOrigin: true
			}
		);

		const topography = L.tileLayer(
			'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
			{
				attribution:
					'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community',
				crossOrigin: true
			}
		);

		const lotBoundaries = {
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
			color: lotColor,
			weight: 1,
			fillOpacity: 0
		});

		// Map

		leafletMap = L.map(mapElement, {
			zoomSnap: 0,
			layers: [topography, lot]
		}).fitBounds(lot.getBounds());

		// Layer control

		const maps = {
			Map: topography,
			Satellite: image
		};

		L.control.layers(maps).addTo(leafletMap);

		// Create a ResizeObserver to watch for changes to the map's container
		resizeObserver = new ResizeObserver(() => {
			// When the size of the container changes, invalidate the map's size
			if (leafletMap) {
				leafletMap.invalidateSize();
			}
		});

		// Start observing the map container
		resizeObserver.observe(mapElement);
	});

	onDestroy(() => {
		// Clean up Leaflet to prevent memory leaks
		if (leafletMap) {
			leafletMap.remove();
		}
		if (resizeObserver) resizeObserver.disconnect(); // Stop observing when component is destroyed
	});
</script>

<div class="map-container" bind:this={mapElement}></div>

<style>
	.map-container {
		position: relative;
		width: 100%;
		max-width: 800px;
		aspect-ratio: 1;
		margin-bottom: 1rem;
	}
</style>
