<script lang="ts">
	import { resolve } from '$app/paths';
	import P5, { type Sketch } from 'p5-svelte';

	let clientWidth: number;
	let width: number;
	let height: number;
	let stroke = 12;

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

	const IMAGE_PREFIX: string = resolve('/images') + '/';
	const url: string = IMAGE_PREFIX + 'mushrooms.json';
	let selectedImagePath: string;
	let selectedImage: any = null;

	// image expansion
	let startX: number; // Initial x-coordinate
	let startY: number; // Initial y-coordinate
	let initialSize = 20; // Initial size (width and height)
	let initialFrameCount = 0;
	let expansionSpeed = 0.01; // How fast the image expands
	let updateComplete = false;

	const fetchData = async (url: string) => {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`HTTP error. Status: ${response.status}`);
		}
		const json = await response.json();
		const data = json.filter((d: FileMap) => d.FileName !== 'IMG_2161.jpeg');

		// Add x, y coordinates
		const latitudeRange = range(data.map((d: FileMap) => d.GPSLatitude));
		const longitudeRange = range(data.map((d: FileMap) => d.GPSLongitude));
		data.forEach((d: FileMap) => {
			d.color = color[d.Who];
			// p5 coordinates are from top left
			d.x = scale(d.GPSLongitude, longitudeRange, width);
			d.y = height - scale(d.GPSLatitude, latitudeRange, height);
		});
		return data;
	};

	const range = (x: number[]): [number, number] => {
		return [Math.min(...x), Math.max(...x)];
	};

	const scale = (x: number, range: [number, number], to: number) => {
		const pad = 0.05;
		const s0 = (x - range[0]) / (range[1] - range[0]);
		return to * (pad + (1 - 2 * pad) * s0);
	};

	const selectImage = async (p5, file: FileMap) => {
		selectedImagePath = IMAGE_PREFIX + file.FileName;
		selectedImage = await p5.loadImage(selectedImagePath);
		startX = p5.mouseX;
		startY = p5.mouseY;
		initialFrameCount = p5.frameCount;
		p5.loop();
	};

	const updateImage = (p5) => {
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

		// Stop loop when at full width. FIXME: full width or height
		if (currentSize >= width) updateComplete = true;
	};

	const removeImage = (p5) => {
		selectedImage = null;
		selectedImagePath = '';
		updateComplete = false;
		p5.loop();
	};

	const mushroomSketch: Sketch = async (p5) => {
		p5.setup = () => {
			width = Math.min(clientWidth, 800)
			height = width
			p5.createCanvas(width, height);
			p5.imageMode(p5.CENTER);
		};

		const data = await fetchData(url);

		const plotData = () => {
			p5.background(220);
			p5.strokeWeight(stroke);
			data.forEach((d: FileMap) => {
				p5.stroke(d.color);
				p5.point(d.x, d.y);
			});
			p5.noLoop();
		};

		p5.draw = () => {
			console.log(selectedImagePath);
			if (selectedImage) {
				updateImage(p5);
				if (updateComplete) p5.noLoop();
			} else {
				plotData();
			}
		};

		p5.mouseClicked = () => {
			if (selectedImage) {
				removeImage(p5);
				return;
			}
			let filtered: FileMap[] = data.filter(
				(d: FileMap) => p5.dist(p5.mouseX, p5.mouseY, d.x, d.y) < stroke / 2
			);
			if (filtered.length) {
				const i = Math.floor(p5.random(filtered.length));
				selectImage(p5, filtered[i]);
			}
		};

		p5.windowResized = () => {
			width = Math.min(clientWidth, 800);
			height = width;
			p5.resizeCanvas(width, height);
		}
	};
</script>

<div class="sketch-container" bind:clientWidth={clientWidth}>
<P5 sketch={mushroomSketch} />
</div>
