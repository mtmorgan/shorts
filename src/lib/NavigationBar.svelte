<script lang="ts">
	import {
		Container,
		Navbar,
		NavbarBrand,
		Nav,
		NavItem,
		NavLink
	} from '@sveltestrap/sveltestrap';
</script>

<Container fluid>
	<header class="site-header">
		<Navbar container="sm" theme="light">
			<NavbarBrand href="https://mtmorgan.github.io" class="me-auto"
				>Martin Morgan</NavbarBrand
			>
			<Nav>
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
		</Navbar>
	</header>
</Container>
