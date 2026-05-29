<script lang="ts">
	import { resolve } from '$app/paths';
	import { onMount, onDestroy } from 'svelte';
	import type { FileMap } from './types';
	import type { Feature, Polygon } from 'geojson';
	import maplibregl, { type LngLatLike } from 'maplibre-gl'; // Import MapLibre GL JS
	import 'maplibre-gl/dist/maplibre-gl.css'; // Import MapLibre CSS
	import Spiderfy from '@nazka/map-gl-js-spiderfy';

	// Data
	const IMAGE_PREFIX: string = resolve('/images/' as any);
	const ICON_PREFIX: string = resolve('/icons/' as any);
	const mushroomsUrl: string = IMAGE_PREFIX + 'mushrooms.json';

	// State for image viewing
	let isImageViewing = $state(false);
	let selectedImageUrl: string = $state('');

	// Map state
	let mapContainer: HTMLDivElement;
	let map: maplibregl.Map;
	let mushroomData: FileMap[] = []; // Store fetched mushroom data

	// --- Image Viewing Logic ---
	const handleMarkerClick = (imgSrc: string) => {
		selectedImageUrl = imgSrc;
		isImageViewing = false; // Reset to ensure transition restarts
		// Use a short timeout to allow a browser paint frame before showing the modal
		setTimeout(() => {
			isImageViewing = true;
		}, 20);
	};

	const closeZoom = () => {
		isImageViewing = false;
	};

	// --- Data Fetching ---
	const fetchData = async (url: string): Promise<FileMap[]> => {
		const reject = new Set(['IMG_2161.jpeg', 'IMG_5989.jpeg']);
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`HTTP error. Status: ${response.status}`);
		}
		const data: FileMap[] = await response.json();
		return data.filter((d: FileMap) => !reject.has(d.FileName));
	};

	// --- Map Initialization and Rendering ---
	const makeArcGISPathsAbsolute = (style: any, baseUrl: string) => {
		const resourcesUrl = baseUrl.replace(/\/styles\/?$/, '');
		const absoluteBase = baseUrl.replace(/\/resources\/styles\/?$/, '');

		const fixPath = (url: string) => {
			if (url.startsWith('../..')) {
				return url.replace('../..', absoluteBase);
			}
			if (url.startsWith('..')) {
				// This would point to /resources/ - usually incorrect for ArcGIS sources
				return url.replace('..', resourcesUrl);
			}
			return url;
		};

		if (style.sprite) style.sprite = fixPath(style.sprite);
		if (style.glyphs) style.glyphs = fixPath(style.glyphs);
		if (style.sources) {
			for (const source in style.sources) {
				if (style.sources[source].url) {
					style.sources[source].url = fixPath(style.sources[source].url);
				}
			}
		}

		return style;
	};

	onMount(async () => {
		mushroomData = await fetchData(mushroomsUrl);

		// Map

		const baseUrl =
			'https://tiles.arcgis.com/tiles/TJH5KDher0W13Kgo/arcgis/rest/services/Ontario_Vector_Topographic_Data_Cache_Service/VectorTileServer/resources/styles';
		const styleUrl = `${baseUrl}/root.json?f=pjson`;
		const rawStyle = await (await fetch(styleUrl)).json();
		const style = makeArcGISPathsAbsolute(rawStyle, baseUrl);

		style.sources.esri['tiles'] = [
			'https://tiles.arcgis.com/tiles/TJH5KDher0W13Kgo/arcgis/rest/services/Ontario_Vector_Topographic_Data_Cache_Service/VectorTileServer/tile/{z}/{y}/{x}.pbf'
		];

		style.sources.esri['attribution'] =
			'<a href="https://geohub.lio.gov.on.ca/maps/mnrf::ontario-vector-topographic-data-cache/about">Ontario Vector Topographic Data Cache</a>';

		// Lot boundaries

		const lotBoundaries: Feature<Polygon> = {
			type: 'Feature',
			properties: {
				name: 'Our Place'
			},
			geometry: {
				type: 'Polygon',
				coordinates: [
					[
						[-79.88035, 43.89948],
						[-79.88149, 43.89841],
						[-79.87843, 43.89613],
						[-79.87626, 43.89452],
						[-79.87114, 43.89904],
						[-79.87342, 43.90079],
						[-79.87692, 43.89754],
						[-79.88035, 43.89948]
					]
				]
			}
		};
		const coordinates = lotBoundaries.geometry.coordinates[0] as LngLatLike[]; // Get the outer ring
		const bounds = coordinates.reduce(
			(bounds, coord) => bounds.extend(coord),
			new maplibregl.LngLatBounds()
		);

		style.sources['lotBoundaries'] = {
			type: 'geojson',
			data: lotBoundaries
		};

		style.layers.push({
			id: 'lot-boundary-layer',
			type: 'line',
			source: 'lotBoundaries',
			paint: {
				'line-color': '#fc8d62',
				'line-opacity': 1
			}
		});

		// Mushrooms

		const alpha = 1;
		const colorMap: { [key in FileMap['Who']]: string } = {
			Alison: `rgba(102, 194, 165, ${alpha})`, // Green, opaque
			Martin: `rgba(252, 141, 98, ${alpha})`, // Salmon, opaque
			Joan: `rgba(117, 112, 179, ${alpha})`, // Purple, opaque
			Katy: `rgba(231, 41, 138, ${alpha})` // Red, opaque
		};

		style.sources['mushrooms'] = {
			type: 'geojson',
			data: {
				type: 'FeatureCollection',
				features: mushroomData.map((d) => ({
					type: 'Feature',
					geometry: {
						type: 'Point',
						coordinates: [d.GPSLongitude, d.GPSLatitude]
					},
					properties: {
						id: d.FileName, // Unique identifier
						imageUrl: `${IMAGE_PREFIX}${d.FileName}`,
						who: d.Who,
						color: colorMap[d.Who]
					}
				}))
			},
			// Enable clustering
			cluster: true,
			clusterMaxZoom: 17,
			clusterRadius: 6
		};

		style.layers.push(
			{
				id: 'mushroom-clusters',
				type: 'symbol',
				source: 'mushrooms',
				filter: ['has', 'point_count'], // Only show clusters
				layout: {
					'icon-image': 'mushroom-cluster',
					'icon-allow-overlap': true
				},
				paint: { 'icon-color': 'white' }
			},
			{
				id: 'mushroom-markers',
				type: 'symbol',
				source: 'mushrooms',
				filter: ['!has', 'point_count'], // Individual markers (not clusters)
				layout: {
					'icon-image': 'mushroom-cluster',
					'icon-allow-overlap': true
				},
				paint: {
					'icon-color': ['get', 'color']
				}
			},
			{
				id: 'mushroom-cluster-count',
				type: 'symbol',
				source: 'mushrooms',
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
			}
		);

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

		map.on('load', async () => {
			const { data: image } = await map.loadImage(
				`${ICON_PREFIX}circle-sdf.png`
			);
			map.addImage('mushroom-cluster', image, { sdf: true });

			const spiderfy = new Spiderfy(map, {
				onLeafClick: (feature) =>
					handleMarkerClick(feature.properties.imageUrl),
				closeOnLeafClick: false,
				circleOptions: { leavesSeparation: 40 },
				spiderLeavesPaint: {
					'icon-color': ['get', 'color']
				}
			});
			spiderfy.applyTo('mushroom-clusters');
		});

		// Event listener for clicking on markers
		map.on('click', (e) => {
			// Query for rendered features at the click point
			const features = map.queryRenderedFeatures(e.point, {
				layers: ['mushroom-markers'] // Check this layers
			});

			if (features.length > 0) {
				const feature = features[0]; // Get the top-most feature
				if (feature.properties && feature.properties.imageUrl) {
					// It's an individual mushroom marker
					handleMarkerClick(feature.properties.imageUrl);
				}
			}
		});

		// Event listener for clicking on image -- prevent default map interactions
		map.on('click', (e) => {
			if (isImageViewing) {
				e.preventDefault();
			}
		});
	});

	onDestroy(() => {
		if (map) {
			map.remove();
		}
	});
</script>

<p>
	Click on a coloured dot to see the picture, or on a number to show pictures at
	that location. Click on the picture to return to the map.
</p>

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
			<img src={selectedImageUrl} alt="Mushroom" class="mushroom-image" />
		{/if}
	</button>
</div>

<p>
	The dots are placed on top of a map showing location of our mushroom
	adventure. The orange lines are the approximate boundary of our property.
	Learn a little more about <a href="ourplace">our place</a>.
</p>

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

	.mushroom-image {
		position: absolute;
		object-fit: cover;
		pointer-events: auto;
		top: 0 !important;
		left: 0 !important;
		width: 100% !important;
		height: 100% !important;
		border-radius: 0px;
	}
</style>
