<script lang="ts">
	import Head from '$lib/components/Head.svelte';
	import MarketTimer from './MarketTimer.svelte';

	let { data } = $props();
</script>

<Head title="Market" />

<h1 class="mt-5 mb-3 font-hero text-3xl font-medium">Market</h1>

{#if data.marketItems.length === 0}
	<MarketTimer />
{:else}
asdasd
{/if}

<!-- <p>Market score: {data.user.shopScore}</p> -->
