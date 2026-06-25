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
	import Cafe from './Cafe.svelte';
	import PunchCard from './PunchCard.svelte';
	import birdData from './birds.json';
	import type { Birds } from './types';

	let birds: Birds = birdData;
	const dailyDurationMs = 70000;
	const pauseDurationMs = 6000;
	const controller = new AnimationController(
		birds,
		dailyDurationMs,
		pauseDurationMs
	);

	const countBirds = (): number => {
		const taxa = new Set<string>();
		Object.values(birds).forEach((observations) => {
			observations.forEach((observation) => {
				if (!taxa.has(observation)) taxa.add(observation);
			});
		});
		return taxa.size;
	};

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
		Most mornings in the spring of 2026 we went from the Hill to the Pond cabin
		(at <a href="ourplace">our place</a>) for a coffee. We sat on the deck and
		turned on the amazing
		<a href="https://merlin.allaboutbirds.org/">Merlin</a> app, listening to the
		birds for a half hour or so. We'd note the birds in a Google sheet.
	</p>

	<p>
		Merlin heard {countBirds()} birds over {controller.allDates.length} days (from
		{controller.allDates[0]} to {controller.allDates[
			controller.allDates.length - 1
		]}). Each day plays back in
		{controller.dailyDurationMs / 1000}
		seconds (so a meditative
		{Math.round(
			((controller.dailyDurationMs / 1000) * controller.allDates.length) / 60
		)} minutes); days with lots of birds scroll by quickly!
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

	<div class="mb-3 text-end">
		{#if controller.errorMessage}
			<div class="invalid-feedback">{controller.errorMessage}</div>
		{/if}
	</div>

	<PunchCard {controller} />

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

	<Cafe {controller} />

	<h1>Implementation Notes</h1>

	<p>
		<a href="https://merlin.allaboutbirds.org/">Merlin</a> really engaged us with
		the birds at our place. We'd get to the Pond cabin some time between 9 and noon.
		We didn't record the weather or other factors. We relied on Merlin for bird identification,
		though as the season progressed we were able to identify our favorite birds both
		by song and sight. We added birds that we saw but didn't hear (e.g., vultures)
		to our list.
	</p>

	<p>
		This page uses <a href="https://svelte.dev/docs/kit/introduction"
			>SvelteKit</a
		>
		and <a href="https://sveltestrap.js.org/">Sveltestrap</a> for front-end
		styling. The 'punchcard' plots use
		<a href="https://d3js.org/">D3</a>. A JavaScript pre-processing step
		accesses the Google sheet to transform the observational data to a JSON
		file.
	</p>
	<p>
		<a href="https://zed.dev/">Zed</a> and Google Gemini (free tier) provided a lot
		of help.
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
