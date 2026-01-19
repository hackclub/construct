<script lang="ts">
	import Head from '$lib/components/Head.svelte';
	import { enhance } from '$app/forms';
	import MarketItem from './MarketItem.svelte';

	let { data } = $props();

	let publicItems = $derived(
		data.marketItems.filter((item) => item.isPublic).sort((a, b) => a.minPrice - b.minPrice)
	);

	let privateItems = $derived(
		data.marketItems.filter((item) => !item.isPublic).sort((a, b) => a.minPrice - b.minPrice)
	);

	let editingId: number | null = $state(null);
	let formData = $state({
		name: '',
		description: '',
		image: '',
		minRequiredShopScore: '0',
		minShopScore: '0',
		maxShopScore: '10000',
		minPrice: '0',
		maxPrice: '0',
		isPublic: false
	});
</script>

<Head title="Market" />

<h1 class="mt-5 mb-3 font-hero text-3xl font-medium">Market</h1>

<div class="flex flex-row">
	<a href="market/item/create" class="button primary md mb-5">Add item</a>
</div>

<div class="mb-5 flex flex-col gap-5">
	<div>
		<h2 class="mb-3 text-2xl font-bold">Public</h2>
		{#if publicItems.length === 0}
			<p class="text-sm text-primary-300">No public items yet.</p>
		{:else}
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
				{#each publicItems as item (item.id)}
					<MarketItem {item} />
				{/each}
			</div>
		{/if}
	</div>

	<div>
		<h2 class="mb-3 text-2xl font-bold">Private</h2>
		{#if privateItems.length === 0}
			<p class="text-sm">Nothing to see here.</p>
		{:else}
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
				{#each privateItems as item (item.id)}
					<MarketItem {item} />
				{/each}
			</div>
		{/if}
	</div>
</div>
