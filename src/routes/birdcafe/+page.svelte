<script lang="ts">
	import { onMount } from 'svelte';
	import { Styles, Container } from '@sveltestrap/sveltestrap';
	import BirdDisplay from './BirdDisplay.svelte';
	import birdData from './birds.json';
	import type { Birds } from './types';

	let birds: Birds = birdData;
</script>

<Styles />

<Container sm>
	<h1>Bird Cafe</h1>

	<BirdDisplay {birds} />
</Container>
