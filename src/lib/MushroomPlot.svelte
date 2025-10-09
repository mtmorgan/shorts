<script lang="ts">
	import { resolve } from '$app/paths';
	import P5, { type Sketch } from 'p5-svelte';

	// Sketch configuration

	let clientWidth: number;
	let width: number;
	let height: number;
	let stroke = 12;
	const backgroundColor = 220;

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
		x: number;
		y: number;
	}

	interface ColorMap {
		[key: string]: string;
	}
	const color: ColorMap = {
		Alison: '#66C2A5', // Green
		Martin: '#FC8D62' // Salmon
	};

	// Image

	const IMAGE_PREFIX: string = resolve('/images') + '/';
	const url: string = IMAGE_PREFIX + 'mushrooms.json';
	let selectedImagePath: string;
	let selectedImage: any = null;

	// Image expansion

	let startX: number; // Initial x-coordinate
	let startY: number; // Initial y-coordinate
	let initialSize = 20; // Initial size (width and height)
	let initialFrameCount = 0;
	let expansionSpeed = 0.01; // How fast the image expands
	let updateComplete = false;

	// Fetch and transform data helpers

	const range = (x: number[]): [number, number] => {
		return [Math.min(...x), Math.max(...x)];
	};

	const scale = (x: number, range: [number, number], to: number) => {
		const pad = 0.05;
		const s0 = (x - range[0]) / (range[1] - range[0]);
		return to * (pad + (1 - 2 * pad) * s0);
	};

	const fetchData = async (url: string) => {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`HTTP error. Status: ${response.status}`);
		}
		const json = await response.json();
		return json.filter((d: FileMap) => d.FileName !== 'IMG_2161.jpeg');
	};

	const scaleData = (data: FileMap[], width: number, height: number) => {
		// Add x, y coordinates
		const latitudeRange = range(data.map((d) => d.GPSLatitude));
		const longitudeRange = range(data.map((d) => d.GPSLongitude));

		data.forEach((d) => {
			d.color = color[d.Who];
			// p5 coordinates are from top left
			d.x = scale(d.GPSLongitude, longitudeRange, width);
			d.y = height - scale(d.GPSLatitude, latitudeRange, height);
		});
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
		scaleData(data, width, height);

		const plotData = () => {
			p5.background(backgroundColor);
			p5.strokeWeight(stroke);
			data.forEach((d: FileMap) => {
				p5.stroke(d.color).point(d.x, d.y);
			});
		};

		// Image load and display

		const labelImage = () => {
			const id = selectedImagePath.substring(
				selectedImagePath.length - 13,
				selectedImagePath.length - 5
			);
			inform(id);
		};

		const selectImage = async (file: FileMap) => {
			selectedImagePath = IMAGE_PREFIX + file.FileName;
			labelImage();
			p5.loadImage(
				selectedImagePath,
				(img) => {
					// Use callback rather than await to ensure that image is fully loaded?
					// Start expansion from mouse position
					startX = p5.mouseX;
					startY = p5.mouseY;
					initialFrameCount = p5.frameCount;
					selectedImage = img;
					p5.loop();
				},
				(event: Event) => {
					inform('Error loading image');
				}
			);
		};

		const updateImage = (p5) => {
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

			// Stop loop when at full width. FIXME: full width or height
			if (currentSize >= width) updateComplete = true;
		};

		const removeImage = () => {
			selectedImage = null;
			selectedImagePath = '';
			updateComplete = false;
			plotData();
		};

		p5.draw = () => {
			if (selectedImage) {
				updateImage(p5);
				labelImage();
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
				removeImage(p5);
				return;
			}
			let nearest: FileMap | null = null;
			let distance = 20;
			data.forEach((d) => {
				let thisDistance = p5.dist(p5.mouseX, p5.mouseY, d.x, d.y)
				if (thisDistance < distance) {
					distance = thisDistance;
					nearest = d;
				}
			});
			if (nearest) selectImage(nearest);
		};

		p5.windowResized = () => {
			width = Math.min(clientWidth, 800);
			height = width;
			scaleData(data, width, height);
			p5.resizeCanvas(width, height);
		};
	};
</script>

<div class="sketch-container" bind:clientWidth>
	<P5 {sketch} />
</div>
