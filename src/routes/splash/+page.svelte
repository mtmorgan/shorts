<script lang="ts">
	import {
		Container,
		Row,
		Col,
		FormGroup,
		Label,
		Input,
		Button
	} from '@sveltestrap/sveltestrap';
	import * as THREE from 'three';
	import RangeComponent from './RangeComponent.svelte';
	import type { SplashConfig, SliderMetadata, Uniforms } from './types';

	import imageSrc from './IMG_2524.jpeg';
	import vertexShader from './shaders/vertex.glsl?raw';
	import fragmentShader from './shaders/fragment.glsl?raw';

	let canvasElement: HTMLCanvasElement;

	// State variables to store the true dimensions of the image
	let imgWidth = $state(1);
	let imgHeight = $state(1);
	let aspectRatioStyle = $derived(`aspect-ratio: ${imgWidth} / ${imgHeight};`);

	const SLIDERS: SliderMetadata[] = [
		{ key: 'easing', label: 'Easing', min: 0.02, max: 0.3, step: 0.02 },
		{
			key: 'frequency',
			label: 'Frequency',
			min: 100.0,
			max: 2000.0,
			step: 50.0
		},
		{ key: 'speed', label: 'Speed', min: 1.0, max: 10.0, step: 0.5 },
		{ key: 'radius', label: 'Radius', min: 0.02, max: 0.5, step: 0.02 },
		{ key: 'hole', label: 'Hole (% of radius)', min: 0, max: 0.5, step: 0.05 },
		{ key: 'intensity', label: 'Drops / Second', min: 0, max: 30, step: 1 },
		{ key: 'strength', label: 'Strength', min: 0, max: 0.25, step: 0.05 }
	];

	// Centralized Preset Registry (Easily add fields or new options here!)
	const PRESETS: Record<string, { displayName: string; values: SplashConfig }> =
		{
			initial: {
				displayName: 'Click',
				values: {
					easing: 0.06,
					frequency: 100.0,
					speed: 10.0,
					radius: 0.5,
					hole: 0,
					intensity: 0,
					strength: 0.25
				}
			},
			raindrop: {
				displayName: '💧 Rain',
				values: {
					easing: 0.02,
					frequency: 500.0,
					speed: 6.0,
					radius: 0.04,
					hole: 0.2,
					intensity: 10,
					strength: 0.2
				}
			},
			raindrops: {
				displayName: '💧💧 Rain',
				values: {
					easing: 0.02,
					frequency: 500.0,
					speed: 6.0,
					radius: 0.04,
					hole: 0.2,
					intensity: 30,
					strength: 0.4
				}
			},
			methane: {
				displayName: 'Methane',
				values: {
					easing: 0.02,
					frequency: 250,
					speed: 4.5,
					radius: 0.5,
					hole: 0.3,
					intensity: 1,
					strength: 0.2
				}
			},
			bird: {
				displayName: '🦆 Bird',
				values: {
					easing: 0.04,
					frequency: 32.0,
					speed: 11.0,
					radius: 0.0,
					hole: 0.1,
					intensity: 2,
					strength: 0.5
				}
			}
		};
	const defaultPresetKey = Object.keys(PRESETS)[0];
	let selectedPreset = $state(defaultPresetKey);
	let config = $state<SplashConfig>({
		...PRESETS[defaultPresetKey].values
	});

	let uniforms: Uniforms | null = null;

	let currentDistortion = 0;
	let targetDistortion = 0;

	let isSlidersDirty = $derived.by((): boolean => {
		const preset = PRESETS[selectedPreset]?.values;
		return (
			!!preset &&
			Object.keys(config).some(
				(k) =>
					config[k as keyof SplashConfig] !== preset[k as keyof SplashConfig]
			)
		);
	});

	const applyPreset = (key: string): void => {
		const targetConfig = PRESETS[key];
		if (!targetConfig) return;
		Object.assign(config, targetConfig.values);
		isSlidersDirty = false;
	};

	$effect(() => {
		if (!canvasElement) return;

		const scene = new THREE.Scene();
		const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 10);
		camera.position.z = 1;

		const renderer = new THREE.WebGLRenderer({
			canvas: canvasElement,
			antialias: true
		});
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

		const MAX_RAIN_DROPS = 50;
		const rainCenters = Array.from(
			{ length: MAX_RAIN_DROPS },
			() => new THREE.Vector2(0, 0)
		);
		const rainTimes = Array.from({ length: MAX_RAIN_DROPS }, () => -999.0);
		const rainStrengths = Array.from({ length: MAX_RAIN_DROPS }, () => 0.0);

		// Add the texture entry and rain arrays to uniforms object
		uniforms = {
			uTime: { value: 0 },
			uClickTime: { value: 0 },
			uSplashCenter: { value: new THREE.Vector2(0.5, 0.5) },
			uStrength: { value: 0 },
			uFrequency: { value: 0 },
			uSpeed: { value: 0 },
			uRadius: { value: 0 },
			uHole: { value: 0 },
			uTexture: { value: null },
			uAspect: { value: 1 },
			uRainCenters: { value: rainCenters },
			uRainTimes: { value: rainTimes },
			uRainStrengths: { value: rainStrengths }
		};

		let nextRainIndex = 0;
		let timeSinceLastRain = 0;
		let nextRainDelay = 0;
		let lastTime = 0;

		const spawnRaindrop = (
			x: number,
			y: number,
			strength: number,
			time: number
		): void => {
			rainCenters[nextRainIndex].set(x, y);
			rainTimes[nextRainIndex] = time;
			rainStrengths[nextRainIndex] = strength;
			nextRainIndex = (nextRainIndex + 1) % MAX_RAIN_DROPS;
		};

		const isImageElement = (
			img: unknown
		): img is { width: number; height: number } => {
			return (
				img !== null &&
				typeof img === 'object' &&
				'width' in img &&
				'height' in img
			);
		};

		// Load image asynchronously
		const textureLoader = new THREE.TextureLoader();
		textureLoader.load(imageSrc, (texture: THREE.Texture): void => {
			if (uniforms) {
				// Prevent texture stretching or pixelation mapping
				texture.minFilter = THREE.LinearFilter;
				uniforms.uTexture.value = texture;
				// Get dimensions of image for display scaling
				if (isImageElement(texture.image)) {
					imgWidth = texture.image.width;
					imgHeight = texture.image.height;
					uniforms.uAspect.value = imgWidth / imgHeight;
				}
			}
		});

		const geometry = new THREE.PlaneGeometry(2, 2);
		const material = new THREE.ShaderMaterial({
			uniforms: uniforms,
			vertexShader: vertexShader,
			fragmentShader: fragmentShader
		});

		const mesh = new THREE.Mesh(geometry, material);
		scene.add(mesh);

		const timer = new THREE.Timer();
		timer.connect(document);
		let animationFrameId: number;

		const animate = (timestamp: number): void => {
			animationFrameId = requestAnimationFrame(animate);
			timer.update(timestamp);

			if (uniforms) {
				const elapsed = timer.getElapsed();
				uniforms.uTime.value = elapsed;
				uniforms.uFrequency.value = config.frequency;
				uniforms.uSpeed.value = config.speed;
				uniforms.uRadius.value = config.radius;
				uniforms.uHole.value = config.hole * config.radius;

				currentDistortion +=
					(targetDistortion - currentDistortion) * config.easing;
				uniforms.uStrength.value = currentDistortion;
				targetDistortion += (0.0 - targetDistortion) * 0.04; // Slower decay for water

				// Ambient Rain Simulation
				const dt = elapsed - lastTime;
				lastTime = elapsed;

				if (config.intensity > 0) {
					timeSinceLastRain += dt;
					if (timeSinceLastRain >= nextRainDelay) {
						// Spawn random drop on water (below horizonY=0.69); rain is denser
						// toward the horizon
						const rx = Math.random();
						const ry = 0.69 - Math.random() * 0.69;
						const rStrength = config.strength * (0.6 + Math.random() * 0.8);
						spawnRaindrop(rx, ry, rStrength, elapsed);

						// Randomize next interval to make it organic (Poisson-like)
						const meanInterval = 1.0 / config.intensity;
						nextRainDelay = meanInterval * (0.4 + Math.random() * 1.2);
						timeSinceLastRain = 0;
					}
				}
			}

			renderer.render(scene, camera);
		};

		animationFrameId = requestAnimationFrame(animate);

		const resizeObserver = new ResizeObserver(
			(entries: ResizeObserverEntry[]): void => {
				for (const entry of entries) {
					const { width, height } = entry.contentRect;
					renderer.setSize(width, height, false);
				}
			}
		);
		resizeObserver.observe(canvasElement);

		return () => {
			cancelAnimationFrame(animationFrameId);
			resizeObserver.disconnect();
			timer.disconnect();
			geometry.dispose();
			material.dispose();
			if (uniforms?.uTexture.value) uniforms.uTexture.value.dispose();
			renderer.dispose();
		};
	});

	const handleCanvasClick = (event: MouseEvent): void => {
		if (!canvasElement || !uniforms) return;

		const rect = canvasElement.getBoundingClientRect();
		const x = (event.clientX - rect.left) / rect.width;
		const y = 1.0 - (event.clientY - rect.top) / rect.height;

		uniforms.uSplashCenter.value.set(x, y);
		uniforms.uClickTime.value = uniforms.uTime.value;
		targetDistortion = config.strength;
	};
</script>

<svelte:head>
	<title>Splash</title>
</svelte:head>

<h1>Splash</h1>

<p>
	Here is a picture of the pond at <a href="ourplace">our place</a>. Clicking on
	the image distorts it as though from a splash. A fish jumping? A kingbird
	fishing? Mosquito larvae gasping for air? A methane bubble? Rain falling (even
	though the sky is blue?)? The possiblities are endless... This is a start at
	using GLSL (OpenGL Shading Language) to explore the effects of light and
	reflection.
</p>
<Row class="g-3 mb-4">
	{#each SLIDERS as slider}
		<RangeComponent {config} {slider} />
	{/each}
</Row>

<Row class="g-3 align-items-end">
	<Col xs={9} sm={4}>
		<FormGroup class="mb-0">
			<Label>Presets</Label>
			<Input
				type="select"
				bind:value={selectedPreset}
				onchange={(e) => applyPreset(e.currentTarget.value)}
			>
				{#each Object.entries(PRESETS) as [key, config]}
					<option value={key}>{config.displayName}</option>
				{/each}
			</Input>
		</FormGroup>
	</Col>
	{#if isSlidersDirty}
		<Col xs={3} sm={2}>
			<FormGroup class="mb-0">
				<Label>&nbsp;</Label>
				<Button onclick={() => applyPreset(selectedPreset)}>Reset</Button>
			</FormGroup>
		</Col>
	{/if}
</Row>

<Container fluid={true} class="p-0 overflow-hidden position-relative">
	<Row class="g-0">
		<Col xs="12">
			<div class="canvas-wrapper mx-auto" style={aspectRatioStyle}>
				<canvas bind:this={canvasElement} onclick={handleCanvasClick}></canvas>
			</div>
		</Col>
	</Row>
</Container>

<h2>Implementation</h2>

<p>
	I've been trying to understand and use GLSL (OpenGL Shading Language) for
	quite a while. I'm interested in caustics, and in particular the sun glints
	that march as armadas across the water when the light and wind are right. But
	I'm not there yet. I've realized that what I might do is use an image (photo)
	as a 'texture' and then write GLSL code to transform the image. Of course
	Google Gemini helped and hindered with a lot of this.
</p>

<style>
	.canvas-wrapper {
		width: 100%;
		max-width: 100%; /* Keep bounding limits within bounds on laptops */
		max-height: 100vh;
		overflow: hidden;
		background: #000; /* Fallback color while image loads */
	}
	canvas {
		display: block;
		width: 100%;
		height: 100%;
	}
</style>
