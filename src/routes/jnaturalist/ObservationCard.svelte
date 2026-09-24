<script lang="ts">
	import { Card, CardImg, CardBody } from '@sveltestrap/sveltestrap';
	import type { ObservationResult } from './utilities/queries';
	import { photoSrc } from './utilities/algorithms';

	let { observation }: { observation: ObservationResult } = $props();
	let src = $derived(photoSrc(observation, 'small'));
</script>

<Card class="h-100 shadow-sm">
	<CardImg top {src} alt={observation.taxon.name} class="filmstrip-img" />
	<CardBody class="p-2 w-100" style="min-width: 0;">
		<p
			class="m-0 text-break"
			style="white-space: normal;"
			title={observation.taxon.name}
		>
			<span class="fst-italic">{observation.taxon.name}</span>
			({observation.taxon.preferred_common_name?.toLowerCase()}),
			{new Date(observation.observed_on_string).toDateString()}
			<a
				href="https://www.inaturalist.org/observations/{observation.id}"
				target="_blank"
				rel="noopener noreferrer"
				><img
					alt="iNaturalist"
					src="https://github.com/inaturalist/inaturalist/blob/main/app/assets/images/bird.png?raw=true"
					style="height: .9lh; width: auto; vertical-align: text-bottom;"
				/></a
			>.
		</p>
	</CardBody>
</Card>
