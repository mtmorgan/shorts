<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { FormGroup, Input, Alert, Spinner } from '@sveltestrap/sveltestrap';

	import { HTTPError } from 'ky';
	import {
		queryObservations,
		queryObservers,
		type ObservationResult,
		type ObserversResult
	} from './utilities/queries';

	import ObservationsCarousel from './ObservationsCarousel.svelte';
	import ObservationsMap from './ObservationsMap.svelte';
	import Observer from './Observer.svelte';

	// All observations, populated once in onMount
	let allObservations = $state<ObservationResult[]>([]);
	let observers = $state<ObserversResult[]>([]);
	$inspect(observers);
	let selectedUserLogin = $state<string>('');

	let selectedUser = $state<string>('');
	let observations = $state<ObservationResult[]>([]);
	let isLoading = $state<boolean>(false);
	let errorMessage = $state<string | null>(null);

	// Dropdown Change Handler
	async function handleUserSelection(event: Event) {
		const target = event.target as HTMLSelectElement;
		selectedUser = target.value;

		if (!selectedUser) {
			observations = [];
		} else {
			observations = allObservations.filter(
				(observation) => observation.user.login === selectedUser
			);
		}
	}

	onMount(async () => {
		// Observations and observers
		isLoading = true;
		try {
			allObservations = await queryObservations();
			observers = await queryObservers(allObservations);
			console.log($state.snapshot(observers));
		} catch (error) {
			if (error instanceof HTTPError) {
				errorMessage = `API Error (${error.response.status}): ${error.response.statusText}`;
			} else {
				errorMessage = 'A network or unexpected client error occurred.';
			}
			console.error('Fetch error:', error);
			allObservations = [];
			observers = [];
		} finally {
			isLoading = false;
		}
	});
</script>

<svelte:head>
	<title>jNaturalist</title>
</svelte:head>

<h1>jNaturalist</h1>

<p>
	We encounter all kinds of plants and animals when walking around <a
		href="ourplace">our place</a
	>. I use the <a href="https://www.inaturalist.org/">iNaturalist</a> app as a
	kind of tricorder to find out the names of the things we see; Joan posts some
	of her
	<a href="https://www.inaturalist.org/observations?user_id=joanmontagnes"
		>observations</a
	>. In the past I thought 'naming things' seemed pretty pointless (maybe
	because I was no good at it), and I resisted. But actually one starts to learn
	about the world, and to be able to share the really bizzare things that nature
	does.
</p>

<p>
	Click on the <img
		alt="iNaturalist app icon"
		src="https://github.com/inaturalist/inaturalist/blob/main/app/assets/images/bird.png?raw=true"
		style="height: 1lh; width: auto; vertical-align: baseline;"
	/> icons when they appear to get the iNaturalist page for the observer or observations.
</p>

<h2>iNaturalist observers</h2>

{#if errorMessage}
	<Alert color="danger">{errorMessage}</Alert>
{/if}

<FormGroup class="mb-4">
	{#if isLoading}
		<div class="d-flex align-items-center gap-2 text-muted my-2">
			<Spinner size="sm" type="border" color="primary" />
			<span>Indexing contributors at our place...</span>
		</div>
	{/if}

	<!-- Sveltestrap dynamic type="select" inputs binding standard onchange triggers -->
	<Input
		type="select"
		id="observerSelect"
		value={selectedUserLogin}
		onchange={handleUserSelection}
		disabled={isLoading || observers.length === 0}
	>
		<option value="">
			{observers.length === 0 && !isLoading
				? 'No observers found'
				: '-- Select an observer --'}
		</option>

		{#each observers as item (item.user.id)}
			<option value={item.user.login}>
				{item.user.login}
			</option>
		{/each}
	</Input>
</FormGroup>

<!-- State UI Layouts -->

{#if errorMessage}
	<p class="error">{errorMessage}</p>
{/if}

{#if !isLoading && selectedUser && observations.length === 0 && !errorMessage}
	<p class="status">No observations for @{selectedUser} at our place.</p>
{:else}
	<Observer {observers} {selectedUser} />
	<ObservationsCarousel {observations} />
{/if}

<ObservationsMap />

<h2>Implementation notes</h2>

<style>
	.status {
		color: #555;
		font-style: italic;
	}
	.error {
		color: #d32f2f;
		font-weight: bold;
	}
</style>
