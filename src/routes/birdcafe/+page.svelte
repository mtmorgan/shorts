<script lang="ts">
	import { Styles, Container } from '@sveltestrap/sveltestrap';
	import BirdDisplay from './BirdDisplay.svelte';
	import birdData from './birds.json';
	import type { Birds } from './types';

	let birds: Birds = birdData;
</script>

<Styles />

<Container sm>
	<h1>Bird Caf&eacute;</h1>

	<p>
		Most mornings we head from the hill cabin to the pond cabin (see <a
			href="ourplace">our place</a
		>) for a coffee. We sit on the deck and turn on the amazing
		<a href="https://merlin.allaboutbirds.org/">Merlin</a> app, listening to the
		birds for a half hour or so. We then record the birds we heard that day in a
		Google sheet.
	</p>

	<BirdDisplay {birds} />

	<h1>Implementation Notes</h1>

	<p>
		<a href="https://merlin.allaboutbirds.org/">Merlin</a> really engaged us with
		the birds at our place. Our recordings weren't very systematic. We'd get to the
		pond cabin some time between 9 and noon. We didn't record the weather or other
		factors likely to influence birds we heard. We relied almost entirely on Merlin
		for bird identification, though as the season progressed we became better at
		identifying our favorite birds both by song and sight. We'd add birds that we
		saw but didn't hear (e.g., vultures) to our list.
	</p>

	<p>
		This page uses the JavaScript <a
			href="https://svelte.dev/docs/kit/introduction">SvelteKit</a
		>
		framework and <a href="https://sveltestrap.js.org/">Sveltestrap</a> for front-end
		styling. I used JavaScript in a pre-processing step to access the Google sheet
		and transformed the observational data for use as a static JSON file in the animation.
		Animations use CSS. Google Gemini (free tier) provided a lot of help.
	</p>

	<p>
		Images are from queries to the
		<a href="https://www.inaturalist.org/">iNaturalist</a>
		<a href="https://api.inaturalist.org/v2/docs/">API</a>.
	</p>
</Container>
