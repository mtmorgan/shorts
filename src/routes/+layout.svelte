<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import { Styles } from '@sveltestrap/sveltestrap';
	import NavigationBar from '$lib/components/NavigationBar.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import LayoutContainer from '$lib/components/LayoutContainer.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Shorts</title>
</svelte:head>

<NavigationBar />
<main>
	<Styles />
	<LayoutContainer>
		{@render children?.()}
	</LayoutContainer>
</main>

<Footer />
