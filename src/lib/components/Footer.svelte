<!-- src/lib/components/Footer.svelte -->
<script lang="ts">
	import { Container, Row, Col } from '@sveltestrap/sveltestrap';
	import PageQRCode from './PageQRCode.svelte';
</script>

<footer class="site-footer h-card border-top py-5 mt-5">
	<a class="u-url d-none" href="/shorts">shorts</a>

	<Container>
		<Row class="gy-4">
			<Col xs="12" lg="auto" class="footer-col footer-col-1">
				<ul class="contact-list list-unstyled mb-0">
					<li class="p-name">Martin Morgan</li>
					<li>
						<a
							class="u-email text-decoration-none"
							href="mailto:mtmorgan.xyz@gmail.com"
						>
							mtmorgan.xyz@gmail.com
						</a>
					</li>
				</ul>
			</Col>

			<Col xs="12" lg="auto" class="footer-col footer-col-2">
				<ul class="social-media-list list-unstyled mb-0">
					<li>
						<div class="d-flex align-items-center gap-2">
							<svg
								class="svg-icon text-dark"
								width="20"
								height="20"
								viewBox="0 0 16 16"
								fill="currentColor"
								aria-hidden="true"
							>
								<path
									d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"
								/>
							</svg>
							<a href="https://github.com" class="text-decoration-none">
								<span class="username">mtmorgan</span>
							</a>
						</div>
					</li>
				</ul>
			</Col>

			<Col xs="12" lg="5" class="footer-col footer-col-3">
				<p class="text-muted mb-0 small-text">
					Martin Morgan is an accomplished bioinformatics leader with special
					expertise in R. Martin originally trained as a biologist interested in
					the evolution of plant reproductive morphology.
				</p>
			</Col>

			<Col xs="12" lg="auto" class="footer-col footer-col-4">
				<div class="qr-wrapper">
					<PageQRCode />
				</div>
			</Col>
		</Row>
	</Container>
</footer>

<style>
	.svg-icon {
		vertical-align: middle;
	}
	.small-text {
		line-height: 1.5;
	}
</style>
