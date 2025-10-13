<script lang="ts">
	import { Styles, Container } from '@sveltestrap/sveltestrap';
	import OurPlace from '$lib/OurPlace.svelte';
</script>

<Styles />

<Container sm>
	<h1>Our Place</h1>

	<p>
		We have some rural property outside Caledon East, Ontario. It was purchased
		by Joan's grandfather after the Second World War. It was a 100 acre
		more-or-less square lot, but is now an 'L'-shaped 55 acres, outlined in
		orange in the image below. There are two cabins on the property. The
		all-season 'Hill' cabin is to the west, the summer 'Pond' cabin to the
		south. The Pond cabin is adjacent to an artificial pond Joan's grandfather
		built after <a href="https://en.wikipedia.org/wiki/Hurricane_Hazel"
			>Hurricane Hazel</a
		> in 1954.
	</p>

	<p>
		The property is mostly wooded now. Hardwoods appear as relatively open areas
		in the 'Satellite' layer, in the north west near the Hill cabin and in the
		north east corner of the property. Part of the land south and east of the
		Pond cabin is a pine plantation. The topography layer shows a fairly
		extensive cedar swamp surrounding small streams running through the
		property.
	</p>

	<p>
		There are a number of trails on the property. One trail goes from the Hill
		cabin to the Pond cabin. A second trail loops from the Pond cabin through
		the pine plantation and into the hardwoods. An old 'loggers cabin' (now just
		a rusted bed) marks the turning point before heading back. Just before
		reaching the Pond cabin, there's a small stream and trail that heads
		upstream toward the Hill cabin.
	</p>

	<p>
		The map and satellite imagery below show the property.
	</p>

	<OurPlace />
</Container>
