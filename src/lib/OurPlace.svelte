<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import maplibregl from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import { getStyledMap } from '$lib/map/baseLayer';
	import { getLotBounds } from '$lib/map/lotBoundaries';
	import { addLayerControl } from '$lib/map/controls';

	let mapElement: HTMLDivElement;
	let map: maplibregl.Map;

	onMount(async () => {
		const style = await getStyledMap(true);
		const bounds = getLotBounds();

		map = new maplibregl.Map({
			container: mapElement,
			style: style,
			bounds: bounds
		});

		map.addControl(
			new maplibregl.NavigationControl({
				showZoom: true,
				showCompass: false
			})
		);

		map.addControl(
			new maplibregl.GeolocateControl({
				positionOptions: {
					enableHighAccuracy: true
				},
				trackUserLocation: true
			})
		);

		// Add Layer Control
		map.on('load', () => {
			addLayerControl(map);
		});
	});

	onDestroy(() => {
		if (map) {
			map.remove();
		}
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
