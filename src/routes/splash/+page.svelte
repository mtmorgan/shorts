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
	import type { SplashConfig, SliderMetadata } from './types';

	import imageSrc from './IMG_2524.jpeg';
	import vertexShader from './shaders/vertex.glsl?raw';
	import fragmentShader from './shaders/fragment.glsl?raw';

	let canvasElement: HTMLCanvasElement;

	// State variables to store the true dimensions of the image
	let imgWidth = $state(1);
	let imgHeight = $state(1);
	let aspectRatioStyle = $derived(`aspect-ratio: ${imgWidth} / ${imgHeight};`);

	const SLIDER_DEFINITIONS: SliderMetadata[] = [
		{
			key: 'lerpFactor',
			label: 'Wave Speed / Easing',
			min: 0.001,
			max: 0.3,
			step: 0.01
		},
		{
			key: 'distortionSpike',
			label: 'Ripple Height / Strength',
			min: 0.01,
			max: 0.25,
			step: 0.01
		},
		{
			key: 'waveFrequency',
			label: 'Ring Density / Frequency',
			min: 20.0,
			max: 150.0,
			step: 1.0
		},
		{
			key: 'expansionSpeed',
			label: 'Expansion Speed',
			min: 5.0,
			max: 50.0,
			step: 0.5
		},
		{
			key: 'maxRadius',
			label: 'Maximum Radius',
			min: 0.02,
			max: 0.5,
			step: 0.02
		}
	];

	// Centralized Preset Registry (Easily add fields or new options here!)
	const PRESETS: Record<string, { displayName: string; values: SplashConfig }> =
		{
			initial: {
				displayName: 'Initial',
				values: {
					lerpFactor: 0.008,
					distortionSpike: 0.07,
					waveFrequency: 85.0,
					expansionSpeed: 24.0,
					maxRadius: 0.1
				}
			},
			raindrop: {
				displayName: '💧 Raindrop',
				values: {
					lerpFactor: 0.021,
					distortionSpike: 0.25,
					waveFrequency: 150.0,
					expansionSpeed: 6.0,
					maxRadius: 0.04
				}
			},
			bird: {
				displayName: '🦆 Bird',
				values: {
					lerpFactor: 0.04,
					distortionSpike: 0.09,
					waveFrequency: 32.0,
					expansionSpeed: 11.0,
					maxRadius: 0.2
				}
			}
		};
	const defaultPresetKey = Object.keys(PRESETS)[1];
	let selectedPreset = $state(defaultPresetKey);
	let config = $state<SplashConfig>({
		...PRESETS[defaultPresetKey].values
	});

	let uniforms: {
		uTime: { value: number };
		uClickTime: { value: number };
		uSplashCenter: { value: THREE.Vector2 };
		uDistortionStrength: { value: number };
		uWaveFrequency: { value: number };
		uExpansionSpeed: { value: number };
		uMaxRadius: { value: number };
		uTexture: { value: THREE.Texture | null }; // Texture slot configuration
		uAspect: { value: number };
	} | null = null;

	let currentDistortion = 0;
	let targetDistortion = 0;

	let isSlidersDirty = $derived.by(() => {
		const preset = PRESETS[selectedPreset]?.values;
		return (
			!!preset &&
			Object.keys(config).some(
				(k) =>
					config[k as keyof SplashConfig] !== preset[k as keyof SplashConfig]
			)
		);
	});

	const applyPreset = (key: string) => {
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

		// Add the texture entry to uniforms object
		uniforms = {
			uTime: { value: 0 },
			uClickTime: { value: 0 },
			uSplashCenter: { value: new THREE.Vector2(0.5, 0.5) },
			uDistortionStrength: { value: 0 },
			uWaveFrequency: { value: 0 },
			uExpansionSpeed: { value: 0 },
			uMaxRadius: { value: 0 },
			uTexture: { value: null },
			uAspect: { value: 1 }
		};

		// Load image asynchronously
		const textureLoader = new THREE.TextureLoader();
		textureLoader.load(imageSrc, (texture) => {
			if (uniforms) {
				// Prevent texture stretching or pixelation mapping
				texture.minFilter = THREE.LinearFilter;
				uniforms.uTexture.value = texture;
				// Get dimensions of image for display scaling
				imgWidth = texture.image.width;
				imgHeight = texture.image.height;
				uniforms.uAspect.value = imgWidth / imgHeight;
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

		const animate = (timestamp: number) => {
			animationFrameId = requestAnimationFrame(animate);
			timer.update(timestamp);

			if (uniforms) {
				uniforms.uTime.value = timer.getElapsed();
				uniforms.uWaveFrequency.value = config.waveFrequency;
				uniforms.uExpansionSpeed.value = config.expansionSpeed;
				uniforms.uMaxRadius.value = config.maxRadius;

				currentDistortion +=
					(targetDistortion - currentDistortion) * config.lerpFactor;
				uniforms.uDistortionStrength.value = currentDistortion;
				targetDistortion += (0.0 - targetDistortion) * 0.04; // Slower decay for water
			}

			renderer.render(scene, camera);
		};

		animationFrameId = requestAnimationFrame(animate);

		const resizeObserver = new ResizeObserver((entries) => {
			for (const entry of entries) {
				const { width, height } = entry.contentRect;
				renderer.setSize(width, height, false);
			}
		});
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

	const handleCanvasClick = (event: MouseEvent) => {
		if (!canvasElement || !uniforms) return;

		const rect = canvasElement.getBoundingClientRect();
		const x = (event.clientX - rect.left) / rect.width;
		const y = 1.0 - (event.clientY - rect.top) / rect.height;

		uniforms.uSplashCenter.value.set(x, y);
		uniforms.uClickTime.value = uniforms.uTime.value;
		targetDistortion = config.distortionSpike;
	};
</script>

<svelte:head>
	<title>Splash</title>
</svelte:head>

<h1>Splash</h1>

<p>
	Here is a picture of the pond at <a href="ourplace">our place</a>. Clicking on
	the image distorts it as though from a splash. A fish jumping? A kingbird
	fishing? Mosquito larvae gasping for air? A methane bubble? The possiblities
	are endless... This is a start at using GLSL (OpenGL Shading Language) to
	explore the effects of light and reflection.
</p>
<Row class="g-3 mb-4">
	{#each SLIDER_DEFINITIONS as slider}
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
	Google Gemini wrote the first iteration of this.
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
