<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { resolve } from '$app/paths';
	import P5, { type Sketch } from 'p5-svelte';
	import 'leaflet/dist/leaflet.css';

	// Sketch configuration

	let clientWidth = $state(0);
	let width: number;
	let height: number;
	const clickDistance = 8;

	// P5 / leaflet coordination

	// Use a reactive Svelte variable to hold map bounds.
	// This allows the p5 sketch to react to changes in the map view.
	let mapBounds = $state({
		latLngToPixel: (lat, lon) => ({ x: 0, y: 0 }),
		zoom: () => 0
	});

	// Data

	interface FileMap {
		// EXIF data fields
		CreationDate: string;
		FileName: string;
		GPSLatitude: number;
		GPSLongitude: number;
		Who: string;
		// Calculated fields
		color: string;
		distance: number;
	}

	interface ColorMap {
		[key: string]: string;
	}
	const color: ColorMap = {
		Alison: '#66C2A5', // Green
		Martin: '#FC8D62', // Salmon
		Joan: '#7570B3', // Purple
		Katy: '#E7298A' // Hot pink
	};

	// Image

	const IMAGE_PREFIX: string = resolve('/images') + '/';
	const url: string = IMAGE_PREFIX + 'mushrooms.json';
	let selectedImage: any = null;

	// Image expansion

	let startX: number; // Initial x-coordinate
	let startY: number; // Initial y-coordinate
	let initialSize = 20; // Initial size (width and height)
	let initialFrameCount = 0;
	let expansionSpeed = 0.01; // How fast the image expands
	let updateComplete = false;

	// Fetch and transform data helpers

	const fetchData = async (url: string) => {
		const reject = new Set(['IMG_2161.jpeg', 'IMG_5989.jpeg']);
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`HTTP error. Status: ${response.status}`);
		}
		const data: FileMap[] = await response.json();
		// Remove out-of-bound images; color by creator
		const filtered = data.filter((d: FileMap) => !reject.has(d.FileName));
		filtered.forEach((d) => (d.color = color[d.Who]));
		return filtered;
	};

	// sketch

	const sketch: Sketch = async (p5) => {
		p5.setup = () => {
			width = Math.min(clientWidth, 800);
			height = width;
			p5.createCanvas(width, height);
			p5.imageMode(p5.CENTER);
		};

		// Utility

		const inform = (message: string) => {
			// Display message at bottom left of sketch
			p5.strokeWeight(0);
			p5.fill('white').rect(9, height - 8, p5.textWidth(message) + 2, -13);
			p5.fill('black').text(message, 10, height - 10);
		};

		// Data load and display

		const data: FileMap[] = await fetchData(url);
		let selected: FileMap[] = Array();

		const plotData = () => {
			p5.background(0, 0); // Transparent
			p5.clear();
			p5.strokeWeight(1);
			data.forEach((d: FileMap) => {
				const color = p5.color(d.color);
				const { x, y } = mapBounds.latLngToPixel(d.GPSLatitude, d.GPSLongitude);
				p5.stroke(color);
				color.setAlpha(100);
				p5.fill(color).circle(x, y, 2 * clickDistance);
			});
		};

		// Image load and display

		const queueImages = (mouseX: number, mouseY: number) => {
			selected = data.filter((d) => {
				const { x, y } = mapBounds.latLngToPixel(d.GPSLatitude, d.GPSLongitude);
				d.distance = p5.dist(mouseX, mouseY, x, y);
				return d.distance < clickDistance;
			});
			selected.sort((x, y) => x.distance - y.distance);
		};

		const labelImage = () => {
			const path = selected[0].FileName;
			const id = path.substring(path.length - 13, path.length - 5);
			inform(id);
		};

		const selectImage = async () => {
			if (!selected.length) {
				return;
			}

			labelImage();
			p5.loadImage(
				IMAGE_PREFIX + selected[0].FileName,
				(img) => {
					// Use callback rather than await to ensure that image is fully loaded?
					// Start expansion from mouse position
					startX = p5.mouseX;
					startY = p5.mouseY;
					initialFrameCount = p5.frameCount;
					selectedImage = img;
					p5.loop();
				},
				() => {
					inform('Error loading image');
				}
			);
		};

		const updateImage = () => {
			// Redraw the data layer so images expanding toward center don't 'streak'
			plotData();

			// Calculate current size based on expansion progress
			const frameCount = p5.frameCount - initialFrameCount;
			let currentSize =
				initialSize + (width - initialSize) * frameCount * expansionSpeed;

			// Calculate current position to expand from the center of the initial point
			let currentX = startX;
			let currentY = startY;

			// If the image is expanding beyond its initial point, adjust its position
			// to expand towards the center of the canvas
			if (currentSize > initialSize) {
				let expansionRatio =
					(currentSize - initialSize) / (width - initialSize);
				currentX = p5.lerp(startX, width / 2, expansionRatio);
				currentY = p5.lerp(startY, height / 2, expansionRatio);
			}

			// Draw the image with the calculated size and position
			const currentHeight =
				currentSize * (selectedImage.height / selectedImage.width);
			p5.image(selectedImage, currentX, currentY, currentSize, currentHeight);
			labelImage();

			// Stop loop when at full width. FIXME: full width or height
			if (currentSize >= width) updateComplete = true;
		};

		const removeImage = () => {
			selected.shift();
			p5.clear(); // Remove image & data
			selectedImage = null;
			updateComplete = false;
			plotData();
		};

		p5.draw = () => {
			if (!mapBounds) return; // Map not ready

			if (selectedImage) {
				updateImage();
				if (updateComplete) {
					p5.noLoop();
				}
			} else {
				plotData();
				p5.noLoop();
			}
		};

		p5.mouseClicked = () => {
			if (selectedImage) {
				removeImage();
			} else {
				queueImages(p5.mouseX, p5.mouseY);
			}
			selectImage();
		};

		p5.windowResized = () => {
			width = Math.min(clientWidth, 800);
			height = width;
			p5.resizeCanvas(width, height);
		};
	};

	// Map

	// Leaflet map variables
	let mapElement: HTMLDivElement;
	let leafletMap: L.Map;
	const lotColor = '#fc8d62';

	onMount(async () => {
		const L = await import('leaflet');

		const topography = L.tileLayer(
			'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
			{
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

		leafletMap = L.map(mapElement, {
			zoomSnap: 0,
			layers: [topography, lot]
		}).fitBounds(lot.getBounds());

		// 2. Pass map data to the p5 sketch on events.
		const updateMapBounds = () => {
			mapBounds = {
				latLngToPixel: (lat, lon) => {
					const point = leafletMap.latLngToLayerPoint([lat, lon]);
					return { x: point.x, y: point.y };
				},
				zoom: () => leafletMap.getZoom()
			};
		};

		// Update p5 coordinates when the map moves or zooms
		leafletMap.on('move', updateMapBounds);
		leafletMap.on('zoom', updateMapBounds);

		updateMapBounds(); // Initialize the bounds once
	});

	onDestroy(() => {
		// Clean up Leaflet to prevent memory leaks
		if (leafletMap) {
			leafletMap.remove();
		}
	});
</script>

<div class="map-container" bind:this={mapElement}>
	<!-- This is the container for the Leaflet map -->
	<!-- p5-svelte will place its canvas here as well -->
	<div class="map-overlay" bind:clientWidth>
		<P5 {sketch} />
	</div>
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
		z-index: 1; /* Lower z-index than the p5 overlay */
	}

	.map-overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 2; /* Ensure p5 is above the map tiles */
	}
</style>
