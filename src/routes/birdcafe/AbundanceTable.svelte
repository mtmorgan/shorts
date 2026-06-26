<script lang="ts">
	import { Table, Row, Col } from '@sveltestrap/sveltestrap';
	import type { BirdObservation } from './types';

	let { counts: observations }: { counts: BirdObservation[] } = $props();
	let sortColumn = $state<'species' | 'count'>('count');
	let sortDirection = $state<1 | -1>(-1);

	let sortRows = $derived(
		[...observations].sort((a, b) => {
			if (sortColumn === 'species') {
				return a.species.localeCompare(b.species) * sortDirection;
			} else {
				return (a.count - b.count) * sortDirection;
			}
		})
	);

	// Sort toggle
	function toggleSort(column: 'species' | 'count') {
		if (sortColumn === column) {
			sortDirection *= -1;
		} else {
			sortColumn = column;
			sortDirection = 1;
		}
	}
</script>

<p>Here's a table of the number of times each bird was observed.</p>

<Row>
	<!-- 100% wide on mobile, smaller relative widths on larger displays -->
	<Col xs="12" sm="10" md="8" lg="6" xl="4">
		<div class="table-container">
			<Table bordered hover>
				<thead>
					<tr>
						<!-- Svelte 5 uses standard onclick attributes instead of on:click -->
						<th
							onclick={() => toggleSort('species')}
							class="sortable-header species-column"
						>
							Bird
							{#if sortColumn === 'species'}
								<span>{sortDirection === 1 ? '▲' : '▼'}</span>
							{/if}
						</th>
						<th
							onclick={() => toggleSort('count')}
							class="sortable-header count-column"
						>
							Count
							{#if sortColumn === 'count'}
								<span>{sortDirection === 1 ? '▲' : '▼'}</span>
							{/if}
						</th>
					</tr>
				</thead>
				<tbody>
					{#each sortRows as observation (observation.species)}
						<tr>
							<td>{observation.species}</td>
							<td>{observation.count}</td>
						</tr>
					{/each}

					{#each Array(Math.max(0, 5 - sortRows.length)) as _}
						<tr class="empty-row">
							<td>&nbsp;</td>
							<td>&nbsp;</td>
						</tr>
					{/each}
				</tbody>
			</Table>
		</div>
	</Col>
</Row>

<style>
	.table-container {
		max-height: 250px;
		overflow-y: auto;
		border: 1px solid #dee2e6;
		border-radius: 0.375rem;
	}

	.sortable-header {
		position: sticky;
		top: 0;
		z-index: 1;
		cursor: pointer;
		user-select: none;
		background-color: #f8f9fa;
		transition: background-color 0.2s;
	}

	.sortable-header:hover {
		background-color: #e9ecef;
	}

	.sortable-header span {
		font-size: 0.8em;
		margin-left: 0.5rem;
	}

	.species-column {
		width: max-content;
		white-space: nowrap;
	}

	.count-column {
		width: 1%;
		white-space: nowrap;
	}

	.empty-row td {
		height: 48px;
	}
</style>
