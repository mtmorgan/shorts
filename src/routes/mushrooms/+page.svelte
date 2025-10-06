<script lang="ts">
	import { Styles, Container } from '@sveltestrap/sveltestrap';
	import MushroomPlot from '$lib/MushroomPlot.svelte';

	let width = 400;
</script>

<Styles />

<Container sm>
	<h1>Mushrooms!</h1>

	<p>
		Mushrooms are pretty amazing. Ancient. Weird. Scary. We walked around on a
		couple of days taking pictures of mushrooms. Each dot represents the
		geographical location where one or more pictures were taken. The color of
		the dot indicates who took the picture. Click on a dot to see the picture
		(or a randomly selected picture if there is more than one taken at that
		location). Click again to show the map.
	</p>

	<MushroomPlot {width} />
</Container>
