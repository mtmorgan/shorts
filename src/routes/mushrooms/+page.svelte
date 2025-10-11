<script lang="ts">
	import { Styles, Container } from '@sveltestrap/sveltestrap';
	import MushroomPlot from '$lib/MushroomPlot.svelte';
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

	<p>
		Click on a dot to see the picture(s). Click again to see the next picture
		(if more than one picture at the location of the click) or to return to the
		map.
	</p>

	<MushroomPlot />

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
		The <a href="https://p5js.org">p5.js</a>
		toolkit is used to render the plot and images, via the
		<a href="https://p5-svelte.netlify.app/">p5-svelte</a> component.
	</p>

	<p>
		Google Gemini was helpful during many steps, and obstinately unhelpful
		during others.
	</p>

	<p>
		The code is available on <a href="https://github.com/mtmorgan/shorts"
			>GitHub</a
		>, especially
		<a
			href="https://github.com/mtmorgan/shorts/blob/main/src/lib/MushroomPlot.svelte"
			>MushroomPlot.svelte</a
		>.
	</p>
</Container>
