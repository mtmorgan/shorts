<script lang="ts">
	import {
		Container,
		Collapse,
		Navbar,
		NavbarBrand,
		Nav,
		NavItem,
		NavLink,
		NavbarToggler
	} from '@sveltestrap/sveltestrap';

	// Track window width for responsive navbar. '576' is the 'sm' breakpoint.
	// See https://getbootstrap.com/docs/5.3/layout/breakpoints/
	let innerWidth: number;
	let isOpen = false;
</script>

<svelte:window bind:innerWidth />

<Navbar container="sm" expand="sm" theme="light">
	<NavbarBrand href="https://mtmorgan.github.io" class="me-auto"
		>Martin Morgan</NavbarBrand
	>
	<NavbarToggler on:click={() => (isOpen = !isOpen)} />
	<Collapse isOpen={innerWidth > 576 || isOpen} navbar>
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
