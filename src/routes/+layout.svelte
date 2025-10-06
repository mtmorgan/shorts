<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import NavigationBar from '$lib/NavigationBar.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<NavigationBar />

{@render children?.()}
