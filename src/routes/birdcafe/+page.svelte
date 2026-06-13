<script lang="ts">
	import { onMount } from 'svelte';
	import {
		Styles,
		Container,
		Button,
		Icon,
		ButtonGroup
	} from '@sveltestrap/sveltestrap';
	import { AnimationController } from './AnimationController.svelte';
	import BirdPhotoDisplay from './BirdPhotoDisplay.svelte';
	import PunchCard from './PunchCard.svelte';
	import birdData from './birds.json';
	import type { Birds } from './types';

	let birds: Birds = birdData;
	const controller = new AnimationController(birds);

	onMount(() => {
		const handleOnline = () => {
			controller.errorMessage = '';
		};
		window.addEventListener('online', handleOnline);

		return () => {
			window.removeEventListener('online', handleOnline);
		};
	});
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

	<p>
		This animation displays pictures of each bird we've seen over {controller
			.allDates.length} days. Each day takes {controller.dailyDurationMs / 1000}
		seconds to display (so about
		{Math.round(
			((controller.dailyDurationMs / 1000) * controller.allDates.length) / 60
		)} minutes for all days); if we saw a lot of birds, they scroll by more quickly!
	</p>

	<ButtonGroup class="mb-3">
		<Button onclick={() => controller.jumpTo(0)}>
			<Icon name="skip-start" />
		</Button>

		<Button onclick={() => controller.navigate('prev')}>
			<Icon name="skip-backward" />
		</Button>

		<Button color="primary" onclick={() => controller.togglePlay()}>
			{#if controller.status.isRunning}
				<Icon name="pause" />
			{:else}
				<Icon name="play" />
			{/if}
		</Button>

		<Button onclick={() => controller.navigate('next')}>
			<Icon name="skip-forward" />
		</Button>

		<Button onclick={() => controller.jumpTo(controller.allDates.length - 1)}>
			<Icon name="skip-end" />
		</Button>
	</ButtonGroup>

	<div class="text-end mb-3">
		{#if controller.status.inIntroduction}
			<div class="fw-bold">
				{controller.statusMessages.date}
			</div>
			<div class="text-muted">
				{controller.statusMessages.observations}
			</div>
		{:else}
			<div class="fw-bold">
				{controller.statusMessages.progress}
			</div>
			<div class="text-muted">
				{controller.statusMessages.name}
			</div>
		{/if}
	</div>

	<BirdPhotoDisplay {controller} />

	<PunchCard {controller} />

	<div class="mb-3 text-end">
		{#if controller.errorMessage}
			<div class="invalid-feedback">{controller.errorMessage}</div>
		{/if}
	</div>

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

<style>
	.invalid-feedback {
		display: block;
	}
</style>
