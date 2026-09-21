<script lang="ts">
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
		>{observer.user.name || observer.user.login}
		has {observer.our_place_count} of {observer.observation_count}
		observations at our place.
	</p>
{/if}
