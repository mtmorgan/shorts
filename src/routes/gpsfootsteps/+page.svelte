<script lang="ts">
	import { Styles, Container } from '@sveltestrap/sveltestrap';
	import GPSFootsteps from '$lib/GPSFootsteps.svelte';
</script>

<Styles />

<Container sm>
	<h1>GPS Footsteps</h1>

	<p>
		This page uses the Geolocation API to track your location. Location data is
		stored in the browser's local storage and is not sent to any server.
		Download your GPS data as a CSV file by clicking the "Download GPS Data"
		button below the map.
	</p>

	<p>
		This application was developed almost exclusively by Google Gemini with a
		few simple prompts.
	</p>

	<GPSFootsteps />
</Container>
