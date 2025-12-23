<script lang="ts">
	import Head from '$lib/components/Head.svelte';
	import MarketItem from './MarketItem.svelte';
	import MarketTimer from './MarketTimer.svelte';

	let { data } = $props();
</script>

<Head title="Market" />

<h1 class="mt-5 mb-2 font-hero text-3xl font-medium">Market</h1>

{#if data.marketItems.length === 0}
	<MarketTimer />
{:else}
	<p class="mb-2">
		Market score: <span class="rounded-xl bg-primary-800 px-1">{data.user.shopScore}</span>
		<span class="opacity-50">(allows you to get stuff for cheaper and unlock more items!)</span>
	</p>

	<div class="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
		{#each data.marketItems as item (item.id)}
			<MarketItem {item} userShopScore={data.user.shopScore} userBricks={data.user.brick} />
		{/each}
	</div>
{/if}
