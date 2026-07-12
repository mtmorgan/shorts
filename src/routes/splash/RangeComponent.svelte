<script lang="ts">
	import { FormGroup, Label, Input, Col } from '@sveltestrap/sveltestrap';
	import type { SplashConfig, SliderMetadata } from './types';

	// Accept the parent state object and the explicit property key string
	let { config, slider } = $props<{
		config: SplashConfig;
		slider: SliderMetadata;
	}>();
</script>

<Col xs={12} sm={6}>
	<FormGroup class={slider.className ?? 'mb-0'}>
		<Label>
			{slider.label} ({config[slider.key]})
		</Label>
		<Input
			type="range"
			label={slider.label}
			min={slider.min}
			max={slider.max}
			step={slider.step}
			bind:value={config[slider.key]}
		/>
	</FormGroup>
</Col>
