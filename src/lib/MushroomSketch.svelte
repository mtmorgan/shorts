<script lang="ts">
	import type { FileMap } from '$lib/types';
	import P5, { type p5, type Sketch } from 'p5-svelte';
	import 'leaflet/dist/leaflet.css';

	// Props & state

	interface Props {
		IMAGE_PREFIX: string;
		data: FileMap[];
		dataVersion: number;
	}
	let { IMAGE_PREFIX, data, dataVersion }: Props = $props();
	let clientWidth = $state(0);

	let p5Instance: P5;
	const handleInstance = (e: CustomEvent<P5>) => {
		p5Instance = e.detail;
	};

	$effect(() => {
		// FIXME: I think this is a workaround for the non-reactive data prop
		// not triggering a redraw on zoom or pan.
		if (dataVersion && p5Instance) {
			if (clientWidth != width) {
				// E.g., change of orientation
				width = clientWidth;
				height = clientWidth;
				p5Instance.resizeCanvas(width, height);
			} else {
				// Zoom or drag
				p5Instance.redraw();
			}
		}
	});

	// Utility

	const inform = (p5: p5, message: string) => {
		// Display message at bottom left of sketch
		p5.strokeWeight(0);
		p5.fill('white').rect(9, height - 8, p5.textWidth(message) + 2, -13);
		p5.fill('black').text(message, 10, height - 10);
	};

	// Sketch configuration

	let width: number;
	let height: number;
	const clickDistance = 8; // Better response to finger on phone screens

	interface ColorMap {
		[key: string]: string;
	}
	const color: ColorMap = {
		Alison: '#66C2A5', // Green
		Martin: '#FC8D62', // Salmon
		Joan: '#7570B3', // Purple
		Katy: '#E7298A' // Red
	};

	// Data

	const plotData = (p5: p5) => {
		p5.background(0, 0); // Transparent
		p5.clear();
		p5.strokeWeight(1);
		data.forEach((d) => {
			const point_color = p5.color(color[d.Who]);
			p5.stroke(point_color);
			point_color.setAlpha(100);
			p5.fill(point_color).circle(d.x, d.y, 2 * clickDistance);
		});
	};

	// Image

	// Image expansion

	const initialSize = 20; // Initial size (width and height)
	const expansionSpeed = 0.01; // How fast the image expands
	let startX: number; // Initial x-coordinate
	let startY: number; // Initial y-coordinate
	let initialFrameCount = 0;
	let updateComplete = false;

	// Image selection and load

	let selected: FileMap[] = Array();
	let selectedImage: any = null;

	const labelImage = (p5: p5) => {
		const path = selected[0].FileName;
		const id = path.substring(path.length - 13, path.length - 5);
		inform(p5, id);
	};

	const queueImages = (p5: p5) => {
		selected = data.filter((d) => {
			d.distance = p5.dist(p5.mouseX, p5.mouseY, d.x, d.y);
			return d.distance < clickDistance;
		});
		selected.sort((x, y) => x.distance - y.distance);
	};

	const selectImage = async (p5: p5) => {
		if (!selected.length) {
			return;
		}

		labelImage(p5);
		p5.loadImage(
			IMAGE_PREFIX + selected[0].FileName,
			(img) => {
				// Use callback to ensure that image is fully loaded?
				// Start expansion from mouse position
				startX = p5.mouseX;
				startY = p5.mouseY;
				initialFrameCount = p5.frameCount;
				selectedImage = img;
				p5.loop();
			},
			() => {
				inform(p5, 'Error loading image');
			}
		);
	};

	const updateImage = (p5: p5) => {
		// Redraw the data layer so images expanding toward center don't 'streak'
		plotData(p5);

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
			let expansionRatio = (currentSize - initialSize) / (width - initialSize);
			currentX = p5.lerp(startX, width / 2, expansionRatio);
			currentY = p5.lerp(startY, height / 2, expansionRatio);
		}

		// Draw the image with the calculated size and position
		const currentHeight =
			currentSize * (selectedImage.height / selectedImage.width);
		p5.image(selectedImage, currentX, currentY, currentSize, currentHeight);
		labelImage(p5);

		// Stop loop when at full width. FIXME: full width or height
		if (currentSize >= width) updateComplete = true;
	};

	const removeImage = (p5: p5) => {
		selected.shift();
		selectedImage = null;
		updateComplete = false;
		p5.clear(); // Remove image & data
		plotData(p5);
	};

	// Sketch

	const sketch: Sketch = async (p5) => {
		p5.setup = () => {
			width = Math.min(clientWidth, 800);
			height = width;
			p5.createCanvas(width, height);
			p5.imageMode(p5.CENTER);
		};

		p5.draw = () => {
			if (selectedImage) {
				updateImage(p5);
				if (updateComplete) {
					p5.noLoop();
				}
			} else {
				plotData(p5);
				p5.noLoop();
			}
		};

		p5.mouseClicked = () => {
			if (selectedImage) {
				removeImage(p5);
			} else {
				queueImages(p5);
			}
			selectImage(p5);
		};

		p5.windowResized = () => {
			width = Math.min(clientWidth, 800);
			height = width;
			p5.resizeCanvas(width, height);
		};
	};
</script>

<div class="map-overlay" bind:clientWidth>
	<P5 {sketch} on:instance={handleInstance} />
</div>

<style>
	:global(.map-overlay) {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		aspect-ratio: 1 / 1;
		z-index: 1001; /* Ensure p5 is above the map tiles */
	}
</style>
