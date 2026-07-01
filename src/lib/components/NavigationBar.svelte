<script lang="ts">
	import {
		Collapse,
		Navbar,
		NavbarBrand,
		Nav,
		NavItem,
		NavLink,
		NavbarToggler
	} from '@sveltestrap/sveltestrap';
	import LayoutContainer from './LayoutContainer.svelte';

	let isOpen = false;
</script>

<LayoutContainer>
	<Navbar expand="sm" theme="light" container={false} class="custom-canvas-nav">
		<NavbarBrand href="https://mtmorgan.github.io" class="me-auto"
			>Martin Morgan</NavbarBrand
		>
		<NavbarToggler on:click={() => (isOpen = !isOpen)} />
		<Collapse {isOpen} navbar expand="sm">
			<Nav class="ms-auto" navbar>
				<NavItem>
					<NavLink href="https://mtmorgan.github.io/bioconductor"
						>R / Bioconductor</NavLink
					>
				</NavItem>
				<NavItem>
					<NavLink href="https://mtmorgan.github.io/javascript"
						>JavaScript</NavLink
					>
				</NavItem>
			</Nav>
		</Collapse>
	</Navbar>
</LayoutContainer>

<style>
	:global(.custom-canvas-nav) {
		position: relative;
		/* Copied from jekyll minima */
		border-top: 5px solid rgb(66, 66, 66);
		border-bottom: 1px solid rgb(232, 232, 232);
	}

	/* This breaks the borders out to the full view canvas while keeping content constrained */
	:global(.custom-canvas-nav::before) {
		content: '';
		position: absolute;
		top: -5px; /* Matches the top border thickness */
		left: 50%;
		transform: translateX(-50%);
		width: 100vw;
		height: calc(100% + 6px); /* Accounting for top + bottom borders */
		border-top: 5px solid rgb(66, 66, 66);
		border-bottom: 1px solid rgb(232, 232, 232);
		z-index: -1;
		pointer-events: none;
	}
</style>
