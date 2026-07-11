<script lang="ts">
	import { Styles, ListGroup, ListGroupItem } from '@sveltestrap/sveltestrap';
</script>

<Styles />

<h1>Shorts</h1>

<p>
	I am exploring some of the natural history of our place, and at the same time
	learning about TypeScript and other browser-based user interfaces.
</p>

<ListGroup>
	<ListGroupItem class="border-0 px-0">
		<a href="./ourplace" class="text-decoration-none">Our Place</a>
		<span class="text-muted"
			>— Describes the location and brief history of our property. An
			interactive map shows the property boundaries and current location using
			<a href="https://maplibre.org/">MapLibre</a> and GIS resources from the Ontario
			Ministry of Natural Resources.</span
		>
	</ListGroupItem>

	<ListGroupItem class="border-0 px-0">
		<a href="./treebark" class="text-decoration-none">Tree Bark</a>
		<span class="text-muted"
			>— Identify trees from their bark; especially useful in winter.</span
		>
	</ListGroupItem>

	<ListGroupItem class="border-0 px-0">
		<a href="./mushrooms" class="text-decoration-none">Mushrooms</a>
		<span class="text-muted"
			>— A group of us walked through the property taking pictures of mushrooms.
			Explore our mushrooms here!</span
		>
	</ListGroupItem>

	<ListGroupItem class="border-0 px-0">
		<a href="./birdcafe" class="text-decoration-none">Bird Café</a>
		<span class="text-muted"
			>— Each morning in the spring of 2026 we headed from the Hill to the Pond
			cabin and listened to the birds using the amazing <a
				href="https://merlin.allaboutbirds.org/">Merlin</a
			> app. This is a summary of the birds we heard.</span
		>
	</ListGroupItem>

	<ListGroupItem class="border-0 px-0">
		<a href="./splash" class="text-decoration-none">Splash</a>
		<span class="text-muted"
			>— Sun reflecting on water creates all kinds of geometric patterns. Splash
			introduces ripples onto the pond using GLSL (OpenGL Scripting Language).</span
		>
	</ListGroupItem>
</ListGroup>

<h2>Implementation notes</h2>

<p>
	This app uses <a href="https://svelte.dev">Svelte 5</a> with
	<a href="https://sveltestrap.js.org">sveltestrap</a>. I've tried to actually
	understand the code that I've generated, but these pages have increasingly
	relied on Google Gemini and other AI resources.
</p>
