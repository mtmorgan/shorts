<script lang="ts">
	import { pluralize } from './utilities/algorithms';
	import type { ObserversResult } from './utilities/queries';

	let {
		observers,
		selectedUser
	}: { observers: ObserversResult[]; selectedUser: string } = $props();
	let observer = $derived(
		observers.filter((observer) => observer.user.login === selectedUser)[0]
	);
</script>

{#if observer}
	<h3>Observer</h3>
	<p>
		{observer.user.name || observer.user.login}
		<a
			href="https://www.inaturalist.org/people/{observer.user.login}"
			target="_blank"
			rel="noopener noreferrer"
			style="display: inline-block; vertical-align: middle;"
			><img
				alt="iNaturalist app icon"
				src="https://github.com/inaturalist/inaturalist/blob/main/app/assets/images/bird.png?raw=true"
				style="height: 1lh; width: auto; vertical-align: baseline; position: relative; top: -0.05em;"
			/></a
		>
		has {observer.our_place_count}
		{pluralize(observer.our_place_count, 'observation')} at our place, and {observer.observation_count}
		{pluralize(observer.observation_count, 'observation')} everywhere.
	</p>
{/if}
