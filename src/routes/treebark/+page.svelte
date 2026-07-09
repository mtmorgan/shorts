<script lang="ts">
	import { browser } from '$app/environment';
	import { Button, Container, Row, Col } from '@sveltestrap/sveltestrap';

	import treesJson from './trees.json';

	const localStorageKey = 'treebark-votes';

	interface TreeData {
		id: string;
		url: string;
		img: { alt: string; src: string };
		title: string;
	}

	type Votes = Record<string, number>;

	type SortOptions =
		| 'treebark-viewed-desc'
		| 'treebark-title-asc'
		| 'treebark-title-desc';

	let trees = $state<TreeData[]>(treesJson);
	let votes = $state<Votes>({});

	let searchQuery = $state('');
	let filteredTrees = $derived(
		trees.filter((tree) =>
			tree.title.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

	let sortSelection = $state<SortOptions>();

	// Sort figures based on vote count or caption.

	const compareByViewed = (votes: Votes, a: TreeData, b: TreeData) => {
		const votesA = votes[a.id] || 0;
		const votesB = votes[b.id] || 0;
		return votesB - votesA;
	};

	const compareByCaption = (a: TreeData, b: TreeData) => {
		return a.title.localeCompare(b.title);
	};

	const sortedTrees = $derived(() => {
		let result = filteredTrees;

		// Select comparison function
		switch (sortSelection) {
			case 'treebark-viewed-desc':
				result.sort((a, b) => compareByViewed(votes, a, b));
				break;
			case 'treebark-title-asc':
				result.sort((a, b) => compareByCaption(a, b));
				break;
			case 'treebark-title-desc':
				result.sort((a, b) => compareByCaption(b, a));
				break;
			default:
				break;
		}
		return result;
	});

	// Reset counters for all images
	const resetAllCounters = () => {
		// Clear the vote data from localStorage
		localStorage.removeItem(localStorageKey);
		votes = {};
	};

	// Update voting
	const upvote = (id: string) => {
		if (votes[id] === undefined) votes[id] = 0;
		votes[id]++;
	};

	const downvote = (id: string) => {
		if (votes[id] && votes[id] !== 0) votes[id]--;
	};

	// Load votes with document
	$effect(() => {
		if (browser) {
			const saved = localStorage.getItem(localStorageKey);
			if (saved) votes = JSON.parse(saved);
		}
	});

	// Auto-save votes to localStorage when they change
	$effect(() => {
		if (browser) {
			localStorage.setItem(localStorageKey, JSON.stringify(votes));
		}
	});
</script>

<svelte:head>
	<title>Tree Bark</title>
</svelte:head>

<h1>Tree Bark</h1>

<p>
	<a href="https://www.ontario.ca/page/tree-atlas/ontario-southcentral"
		>The Tree Atlas: South Central region</a
	>
	from the Ontario Ministry of Natural Resources (MNR) introduces the native trees
	of our region. The MNR site emphasizes leaves for identifying trees, but here we
	use bark. Reviewing tree bark can help identify trees during
	<a href="/woods/">A Walk in the Woods</a>, especially in winter! Not all
	species are present at <a href="ourplace">our place</a>.
</p>

<p>
	Click on an image to learn more about a tree from the Ministry of Natural
	Resources. Click "That's my tree!" to increment a counter and arrange for
	viewed trees to be at the top of the list; this makes it easy to learn common
	trees.
</p>

<div class="treebark-sort-controls">
	<label for="treebark-search-input">Filter:</label>
	<input
		type="text"
		id="treebark-search-input"
		placeholder="Type to filter..."
		bind:value={searchQuery}
	/>
	<br />
	<label for="treebark-sort-select">Keep sorted by:</label>
	<select bind:value={sortSelection} id="treebark-sort-select">
		<option value="treebark-viewed-desc">Views</option>
		<option value="treebark-title-asc">Title (A-Z)</option>
		<option value="treebark-title-desc">Title (Z-A)</option>
	</select>
</div>

<Container fluid class="treebark-container px-0">
	<Row class="g-3">
		{#each sortedTrees() as tree (tree.id)}
			<Col xs={6} lg={4}>
				<figure id={tree.id} class="d-flex flex-column h-100">
					<a href={tree.url}>
						<img
							alt={tree.img.alt}
							src={tree.img.src}
							loading="lazy"
							class="img-fluid w-100"
						/>
					</a>
					<figcaption class="mb-auto">
						<a href={tree.url}>{tree.title}</a>
						<div class="vote-controls">
							<span>👁️ {votes[tree.id] || 0}</span>

							<!-- Upvote Button -->
							<Button onclick={() => upvote(tree.id)} class="upvote-btn"
								>▲</Button
							>

							<!-- Conditional Downvote Button -->
							{#if votes[tree.id] !== undefined && votes[tree.id] !== 0}
								<Button onclick={() => downvote(tree.id)} class="downvote-btn">
									▼
								</Button>
							{/if}
						</div>
					</figcaption>
				</figure>
			</Col>
		{/each}
	</Row>
</Container>

<div class="treebark-sort-controls">
	<button
		type="button"
		id="treebark-reset-votes-button"
		class="dangerous-action-button"
		onclick={() => resetAllCounters()}>Reset All Counts</button
	>
</div>

<h2>Implementation Notes</h2>

<p>
	The idea for this page came from Will F's comment that it would be great to
	know what trees might make an appearance during <a href="/woods/"
		>A Walk in the Woods</a
	>. This was originally written as pure JavaScript, with Google Gemini writing
	most of the JavaScript and CSS code. I moved it to Svelte at a later date,
	resulting in much more compact code.
</p>

<style>
	/* Upvote, downvote, and sort */

	:global(.upvote-btn) {
		background-color: #2e7d32;
		color: white;
	}

	:global(.downvote-btn) {
		background-color: white;
		color: black;
	}

	/* Dangerous action button */

	.dangerous-action-button {
		/* Accessible red with high contrast white text */
		background-color: #b30000; /* A dark red */
		color: #ffffff; /* White text for contrast */
		border: none;
		padding: 5px 10px;
		cursor: pointer;
		border-radius: 4px;

		/* Add padding to account for the icon */
		padding-left: 28px;
		position: relative;
	}

	/* Add a visual cue with a Unicode warning icon */
	.dangerous-action-button::before {
		content: '⚠️'; /* Warning emoji */
		position: absolute;
		left: 8px;
		top: 50%;
		transform: translateY(-50%);
	}

	.dangerous-action-button:hover {
		background-color: #800000; /* Darken on hover */
	}
</style>
