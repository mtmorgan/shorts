<script lang="ts">
	import { resolve } from '$app/paths';
	import { onMount, onDestroy } from 'svelte';
	import type { FileMap } from '$lib/types';
	import type { Feature, Polygon } from 'geojson';
	import 'leaflet/dist/leaflet.css';
	import 'leaflet.markercluster/dist/MarkerCluster.css';
	import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

	// Data

	// NOTE: 'as any' is a workaround to TypeScript issue with resolve()
	const IMAGE_PREFIX: string = resolve('/images/' as any);
	const mushroomsUrl: string = IMAGE_PREFIX + 'mushrooms.json';

	let data: FileMap[] = $state<FileMap[]>([]);

	// Image viewing

	let isImageViewing = $state(false);
	let selectedImageUrl: string = $state('');

	const handleMarkerClick = (imgSrc: string) => {
		selectedImageUrl = imgSrc;
		isImageViewing = false;
		setTimeout(() => {
			isImageViewing = true;
		}, 20); // 30ms is long enough to guarantee a browser paint frame
	};

	const closeZoom = () => {
		isImageViewing = false;
	};

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
		window.L = L;
		await import('leaflet.markercluster');

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

		// Define a color map for the 'Who' field
		const alpha = 0.6;
		const colorMap: { [key in FileMap['Who']]: string } = {
			Alison: `rgba(102, 194, 165, ${alpha})`, // Green, 70% opaque
			Martin: `rgba(252, 141, 98, ${alpha})`, // Salmon, 70% opaque
			Joan: `rgba(117, 112, 179, ${alpha})`, // Purple, 70% opaque
			Katy: `rgba(231, 41, 138, ${alpha})` // Red, 70% opaque
		};
		let markers = L.markerClusterGroup({
			showCoverageOnHover: false,
			maxClusterRadius: 6,
			spiderLegPolylineOptions: { weight: 1 },
			iconCreateFunction: (cluster) => {
				return L.divIcon({
					className: 'custom-marker',
					html: `<div class="marker-circle" style="background-color: 'white';">${cluster.getChildCount()}</div>`,
					iconSize: [16, 16], // Size of the circle
					iconAnchor: [8, 8] // Point of the icon which will correspond to marker's location
				});
			}
		});
		data.forEach((d) => {
			const color = colorMap[d.Who] || '#808080'; // Default to gray if name not in map
			const icon = L.divIcon({
				className: 'custom-marker',
				html: `<div class="marker-circle" style="background-color: ${color};"></div>`,
				iconSize: [12, 12], // Size of the circle
				iconAnchor: [6, 6] // Point of the icon which will correspond to marker's location
			});

			const marker = L.marker([d.GPSLatitude, d.GPSLongitude], {
				icon: icon
			}).on('click', (e) => {
				handleMarkerClick(`${IMAGE_PREFIX}${d.FileName}`);
			});
			markers.addLayer(marker);
		});
		leafletMap.addLayer(markers);
	});

	onDestroy(() => {
		// Clean up Leaflet to prevent memory leaks
		if (leafletMap) {
			leafletMap.remove();
		}
	});
</script>

<div class="map-wrapper">
	<div id="map-container" class="map-container" bind:this={mapElement}></div>
	<button
		type="button"
		class="modal-backdrop"
		class:active-backdrop={isImageViewing}
		onclick={closeZoom}
		aria-label="Close zoomed image"
	>
		{#if isImageViewing}
			<img src={selectedImageUrl} alt="Mushroom" class="mushroom-image" />
		{/if}
	</button>
</div>

<style>
	.map-wrapper {
		position: relative; /* Context for the modal */
		width: min(800px, 100%);
		aspect-ratio: 1 / 1;
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
	}

	/* Image transition state machine */
	.mushroom-image {
		position: absolute;
		object-fit: cover;
		pointer-events: auto;
		top: 0px !important;
		left: 0px !important;
		width: 100% !important;
		height: 100% !important;
		border-radius: 0px;
	}

	/* Adjust Leaflet's default icon styling if needed */
	:global(.custom-marker) {
		display: flex;
		justify-content: center;
		align-items: center;
		border: none !important;
		background: none !important;
	}

	:global(.marker-circle) {
		width: 100%; /* Make it take the full width of its parent */
		height: 100%; /* Make it take the full height of its parent */
		border-radius: 50%;
		display: flex !important;
		align-items: center;
		justify-content: center;
		text-align: center;
		box-sizing: border-box; /* Include padding and border in the element's total width and height */
		border: 1px solid currentColor;
		margin: 0;
	}

	:global(.marker-circle b) {
		display: block;
		line-height: 1;
	}

	/* Ensure the circle itself has dimensions */
	:global(.custom-marker .marker-circle) {
		width: 100%;
		height: 100%;
	}
</style>
