<script lang="ts">
	import { page } from '$app/state';
	import QRCode from 'qrcode';

	let canvasElement = $state<HTMLCanvasElement | null>(null);

	$effect(() => {
		if (canvasElement && page.url.href) {
			QRCode.toCanvas(canvasElement, page.url.href, {
				width: 200,
				margin: 2
			}).catch((err) => {
				console.error('QR Code generation failed:', err);
			});
		}
	});
</script>

<div class="qr-container">
	<canvas bind:this={canvasElement}></canvas>
	<p>Scan to share this page</p>
</div>

<style>
	.qr-container {
		display: flex;
		flex-direction: column;
		align-items: center;
	}
</style>
