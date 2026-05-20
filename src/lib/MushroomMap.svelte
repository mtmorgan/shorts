<script lang="ts">
	import { resolve } from '$app/paths';
	import { onMount, onDestroy } from 'svelte';
	import type { FileMap } from '$lib/types';
	import type { Feature, Polygon } from 'geojson';
	import 'leaflet/dist/leaflet.css';

	// Data

	// NOTE: 'as any' is a workaround to TypeScript issue with resolve()
	const IMAGE_PREFIX: string = resolve('/images/' as any);
	const mushroomsUrl: string = IMAGE_PREFIX + 'mushrooms.json';

	let data: FileMap[] = $state<FileMap[]>([]);

	// Image viewing

	interface DOMRectCoords {
		top: number;
		left: number;
		width: number;
		height: number;
	}

	interface LeafletClickEvent {
		originalEvent: MouseEvent | PointerEvent;
		latlng: any;
		target: L.Marker;
	}

	let isImageViewing = $state(false);
	let selectedImageUrl: string = $state('');
	let originRect = $state<DOMRectCoords | null>(null);

	const handleMarkerClick = (
		leafletEvent: LeafletClickEvent,
		imgSrc: string
	) => {
		const nativeEvent = leafletEvent.originalEvent;
		const markerElement = nativeEvent.target as HTMLElement;
		const rect = markerElement.getBoundingClientRect();
		const containerElement = document.getElementById('map-container');
		if (!containerElement) return;
		const containerRect = containerElement.getBoundingClientRect();

		// Calculate position relative to the map container
		originRect = {
			top: rect.top - containerRect.top,
			left: rect.left - containerRect.left,
			width: rect.width,
			height: rect.height
		};

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
		const colorMap: { [key: string]: string } = {
			Alison: `rgba(102, 194, 165, ${alpha})`, // Green, 70% opaque
			Martin: `rgba(252, 141, 98, ${alpha})`, // Salmon, 70% opaque
			Joan: `rgba(117, 112, 179, ${alpha})`, // Purple, 70% opaque
			Katy: `rgba(231, 41, 138, ${alpha})` // Red, 70% opaque
		};

		data.forEach((d) => {
			const color = colorMap[d.Who] || '#808080'; // Default to gray if name not in map
			const icon = L.divIcon({
				className: 'custom-marker',
				html: `<div class="marker-circle" style="background-color: ${color};"></div>`,
				iconSize: [12, 12], // Size of the circle
				iconAnchor: [6, 6] // Point of the icon which will correspond to marker's location
			});

			L.marker([d.GPSLatitude, d.GPSLongitude], {
				icon: icon
			})
				.addTo(leafletMap)
				.on('click', (e) => {
					handleMarkerClick(e, `${IMAGE_PREFIX}${d.FileName}`);
				});
		});
	});

	onDestroy(() => {
		// Clean up Leaflet to prevent memory leaks
		if (leafletMap) {
			leafletMap.remove();
		}
	});
</script>

<div id="map-container" class="map-container" bind:this={mapElement}>
	<div id="map" class="w-full h-full"></div>
	<button
		type="button"
		class="modal-backdrop"
		class:active-backdrop={isImageViewing}
		data-zoomed={isImageViewing}
		onclick={closeZoom}
		aria-label="Close zoomed image"
	>
		{#if isImageViewing}
			<img
				src={selectedImageUrl}
				alt="Zoomed mushroom"
				class="zoom-image"
				style:--origin-top={`${originRect.top}px`}
				style:--origin-left={`${originRect.left}px`}
				style:--origin-width={`${originRect.width}px`}
				style:--origin-height={`${originRect.height}px`}
			/>
		{/if}
	</button>
</div>

<style>
	.map-container {
		position: relative;
		overflow: hidden;
		width: min(800px, 100%);
		aspect-ratio: 1 / 1;
		margin-bottom: 1rem;
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
	.zoom-image {
		position: absolute;
		object-fit: cover;
		cursor: zoom-out;
		pointer-events: auto;
		border-radius: 50%;
		transition:
			top 1s cubic-bezier(0.25, 1, 0.5, 1),
			left 1s cubic-bezier(0.25, 1, 0.5, 1),
			width 1s cubic-bezier(0.25, 1, 0.5, 1),
			height 1s cubic-bezier(0.25, 1, 0.5, 1),
			border-radius 0.9s ease-out;

		/* Default state: Anchored precisely on top of the Leaflet marker coordinates */
		top: var(--origin-top) !important;
		left: var(--origin-left) !important;
		width: var(--origin-width) !important;
		height: var(--origin-height) !important;
	}

	.modal-backdrop[data-zoomed='true'] .zoom-image {
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
		border: none; /* Remove default marker border */
		/* Ensure the parent div has the correct dimensions */
		width: 12px !important;
		height: 12px !important;
		margin: 0 !important; /* Reset margin if Leaflet adds any */
	}

	:global(.marker-circle) {
		width: 100%; /* Make it take the full width of its parent */
		height: 100%; /* Make it take the full height of its parent */
		border-radius: 50%;
		display: block; /* Ensures the div takes up space */
		box-sizing: border-box; /* Include padding and border in the element's total width and height */
		border: 1px solid currentColor;
	}

	/* Ensure the circle itself has dimensions */
	:global(.custom-marker .marker-circle) {
		width: 100%;
		height: 100%;
	}
</style>
