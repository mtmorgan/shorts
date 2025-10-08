<script lang="ts">
	import { Styles, Container, ListGroup, ListGroupItem, Nav } from '@sveltestrap/sveltestrap';
	import NavigationBar from '$lib/NavigationBar.svelte';
</script>

<Styles />

<Container sm>
	<h1>P5 Shorts</h1>
	<ListGroup>
		<ListGroupItem tag="a" href="./mushrooms" action>Mushrooms</ListGroupItem>
		<ListGroupItem tag="a" href="./sun-glitters" action>Sun glitters</ListGroupItem>
	</ListGroup>
</Container>
