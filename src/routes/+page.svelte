<script lang="ts">
	import {
		Styles,
		Container,
		ListGroup,
		ListGroupItem,
	} from '@sveltestrap/sveltestrap';
	import NavigationBar from '$lib/NavigationBar.svelte';
</script>

<Styles />

<Container sm>
	<h1>P5 Shorts</h1>
	<ListGroup>
		<ListGroupItem tag="a" href="./ourplace" action>Our Place</ListGroupItem>
		<ListGroupItem tag="a" href="./mushrooms" action>Mushrooms</ListGroupItem>
		<ListGroupItem tag="a" href="./sun-glitters" action
			>Sun glitters</ListGroupItem
		>
	</ListGroup>

	<h2>Implementation notes</h2>

	<p>
		This app uses <a href="https://svelte.dev">Svelte</a> with
		<a href="https://sveltestrap.js.org">sveltestrap</a>.
	</p>
</Container>
