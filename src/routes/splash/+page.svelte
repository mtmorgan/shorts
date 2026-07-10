<script lang="ts">
	import { Container, Row, Col } from '@sveltestrap/sveltestrap';
	import * as THREE from 'three';

	import imageSrc from './IMG_2524.jpeg';
	import vertexShader from './shaders/vertex.glsl?raw';
	import fragmentShader from './shaders/fragment.glsl?raw';

	let canvasElement: HTMLCanvasElement;
	let uniforms: {
		uTime: { value: number };
		uClickTime: { value: number };
		uSplashCenter: { value: THREE.Vector2 };
		uDistortionStrength: { value: number };
		uTexture: { value: THREE.Texture | null }; // Texture slot configuration
	} | null = null;

	let currentDistortion = 0;
	let targetDistortion = 0;

	const LERP_FACTOR = 0.008; // Slightly slower for a more natural liquid drag
	const DISTORTION_SPIKE = 0.7; // Higher spike for deeper water displacement

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

		// 2. Add the texture entry to uniforms object
		uniforms = {
			uTime: { value: 0 },
			uClickTime: { value: 0 }, // New uniform to send click timestamp to GPU
			uSplashCenter: { value: new THREE.Vector2(0.5, 0.5) },
			uDistortionStrength: { value: 0 },
			uTexture: { value: null } // Starts empty, filled below
		};

		// 3. Load your water image asynchronously
		const textureLoader = new THREE.TextureLoader();
		textureLoader.load(imageSrc, (texture) => {
			if (uniforms) {
				// Prevent texture stretching or pixelation mapping
				texture.minFilter = THREE.LinearFilter;
				uniforms.uTexture.value = texture;
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

				currentDistortion +=
					(targetDistortion - currentDistortion) * LERP_FACTOR;
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
		targetDistortion = DISTORTION_SPIKE;
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

<Container fluid={true} class="p-0 overflow-hidden">
	<Row class="g-0">
		<Col xs="12">
			<div class="canvas-wrapper">
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
		height: 100vh;
		overflow: hidden;
		background: #000; /* Fallback color while image loads */
	}
	canvas {
		display: block;
		width: 100%;
		height: 100%;
	}
</style>
