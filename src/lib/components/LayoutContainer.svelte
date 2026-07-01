<!-- LayoutContainer.svelte -->
<script>
	import { Container } from '@sveltestrap/sveltestrap';
</script>

<Container
	sm
	style="max-width: calc(800px - 60px); margin: 0 auto; padding: 0 20px;"
>
	<slot />
</Container>
