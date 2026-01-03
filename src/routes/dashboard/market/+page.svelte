<script lang="ts">
	import Head from '$lib/components/Head.svelte';
	import MarketItem from './MarketItem.svelte';
	import MarketTimer from './MarketTimer.svelte';
	import ovenpheus from '$lib/assets/ovenpheus.png';
	import { BRICKS_PER_HOUR, BRICKS_PER_HOUR_CONVERTED, CLAY_PER_HOUR } from '$lib/defs';

	let { data } = $props();
</script>

<Head title="Market" />

<h1 class="mt-5 mb-2 font-hero text-3xl font-medium">Market</h1>

{#if data.marketItems.length === 0}
	<MarketTimer />
{:else}
	<p class="mb-2">
		Market score: <span class="rounded-xl bg-primary-800 px-2"
			>{Math.floor(data.user.shopScore)}</span
		>
		<span class="opacity-50">(allows you to get stuff for cheaper and unlock more items!)</span>
	</p>

	<div class="themed-box mb-5 flex flex-row gap-5 p-3">
		<div class="w-80">
			<img src={ovenpheus} alt="ovenpheus" class="rounded-lg border-20 border-white" />
		</div>
		<div class="flex grow flex-col">
			<div class="animate-pulse">
				<h2 class="text-2xl font-bold text-primary-400">
					Fire your clay into bricks with Ovenpheus today!!1!
				</h2>
				<p class="text-lg text-primary-200">Get your yummy yummy bricks here!</p>
			</div>
			<p>
				You'll get {(data.user.hasBasePrinter ? BRICKS_PER_HOUR : BRICKS_PER_HOUR_CONVERTED) /
					CLAY_PER_HOUR} bricks per clay
			</p>
			<div class="grow"></div>
			<a href="market/ovenpheus" class="button md primary">Go get your bricks</a>
		</div>
	</div>

	<h2 class="mb-2 text-2xl font-bold">Market items</h2>

	<div class="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
		{#each data.marketItems as item (item.id)}
			<MarketItem {item} userShopScore={data.user.shopScore} userBricks={data.user.brick} />
		{/each}
	</div>
{/if}
