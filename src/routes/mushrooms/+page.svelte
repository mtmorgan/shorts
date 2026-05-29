<script lang="ts">
	import { Styles, Container } from '@sveltestrap/sveltestrap';
	import MushroomMap from './MushroomMap.svelte';
	import MushroomWalk from './MushroomWalk.svelte';
</script>

<Styles />

<Container sm>
	<h1>Mushrooms!</h1>

	<p>
		Mushrooms are pretty amazing. Ancient. Weird. Scary. We walked around on a
		couple of days taking pictures of mushrooms. Each dot represents the
		geographical location where one or more pictures were taken. The color of
		the dot indicates who took the picture. Overlapping dots (darker color)
		indicates multiple pictures.
	</p>

	<MushroomMap />

	<MushroomWalk />

	<h2>Implementation notes</h2>

	<p>
		People took pictures on their phones. A trick was to turn the phone upside
		down, so the camera was closer to mushroom level. If actually getting on the
		ground wasn't practical, then switching to 'selfie' mode on the upside down
		phone seemed to allow a better angle.
	</p>

	<p>
		Pictures were sent to me via text, email, etc.; image quality may have been
		degraded during transfer. Phones may have differed in their concept of
		location. I used basic features of the MacOS Photos app to remove the 'Live'
		feature if present, and to export images as medium size, high quality JPEG.
	</p>

	<p>
		I wrote a small <em>R</em> script to convert the metadata to JSON format for
		use in the Svelte app. The <em>R</em> script uses
		<a href="https://joshobrien.github.io/exiftoolr/">exiftoolr</a> to read the
		EXIF data, and
		<a href="https://jeroen.r-universe.dev/jsonlite">jsonlite</a> to write the JSON
		file.
	</p>

	<p>
		Maps were originally drawn using <a href="https://leafletjs.com/">leaflet</a
		>
		and <a href="https://p5js.org">p5.js</a> (via
		<a href="https://p5-svelte.netlify.app/">p5-svelte</a>) but the current
		version uses <a href="https://maplibre.org/">MapLibre</a>.
	</p>

	<p>Google Gemini and other AI helped during many steps.</p>

	<p>
		The code is available on <a href="https://github.com/mtmorgan/shorts"
			>GitHub</a
		>, especially
		<a
			href="https://github.com/mtmorgan/shorts/blob/main/src/routes/mushrooms/MushroomMap.svelte"
			>MushroomMap.svelte</a
		>
		and
		<a
			href="https://github.com/mtmorgan/shorts/blob/main/src/routes/mushrooms/MushroomWalk.svelte"
			>MushroomWalk.svelte</a
		>.
	</p>
</Container>
