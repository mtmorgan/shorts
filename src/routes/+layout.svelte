<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import NavigationBar from '$lib/components/NavigationBar.svelte';
	import Footer from '$lib/components/Footer.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<main>
	<NavigationBar />

	{@render children?.()}
</main>

<Footer />
