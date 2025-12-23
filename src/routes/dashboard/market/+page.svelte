<script lang="ts">
	import Head from '$lib/components/Head.svelte';
	import MarketTimer from './MarketTimer.svelte';

	let { data } = $props();

	function computeUserPrice(item: any) {
		if (typeof item.computedPrice === 'number') return item.computedPrice;

		const max = Number(item.maxPrice || 0);
		const min = Number(item.minPrice || 0);
		const diff = Math.max(0, max - min);
		const shopScore = Number(data?.user?.shopScore || 0);

		const minShop = Number(item.minShopScore || 0);
		const maxShop = Number(item.maxShopScore || 0);
		let discountPercent = 0;
		if (maxShop > minShop) {
			discountPercent = (shopScore - minShop) / (maxShop - minShop);
			discountPercent = Math.max(0, Math.min(1, discountPercent));
		} else {
			discountPercent = 0;
		}

		const discountAmount = diff * discountPercent;
		const rawPrice = Math.ceil(max - discountAmount);
		const price = Math.max(rawPrice, min);
		return price;
	}

	function getPriceInfo(item: any) {
		const max = Number(item.maxPrice || 0);
		const price = computeUserPrice(item);
		const save = Math.max(0, max - price);
		const hasDiscount = save > 0 && max > 0;
		const percentOff = hasDiscount ? Math.ceil((save / max) * 100) : 0;
		return { price, save, hasDiscount, percentOff };
	}

	function formatClays(value: number | string) {
		const n = Number(value || 0);
		return `${n.toLocaleString()} clays`;
	} 
</script>

<Head title="Market" />

<h1 class="mt-5 mb-3 font-hero text-3xl font-medium">Market</h1>

{#if data.marketItems.length === 0}
	<MarketTimer />
{:else}
	<div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
		{#each data.marketItems as item (item.id)}
			<div class="themed-box p-4 flex flex-col gap-3">
				<div class="aspect-square rounded-lg overflow-hidden mb-3 bg-primary-800/10">
					<img src={item.image} alt={item.name} class="w-full h-full object-contain object-center" />
				</div>
				<div>
					<h3 class="text-lg font-hc font-bold mb-1">{item.name}</h3>
					<p class="text-sm text-primary-300 leading-snug">{item.description}</p>
				{#if getPriceInfo(item).hasDiscount}
					<div class="flex items-center gap-3 mt-3">
						<div class="text-sm text-primary-300 line-through">{formatClays(item.maxPrice)}</div>
						<div class="ml-auto text-lg font-bold text-emerald-500">{formatClays(getPriceInfo(item).price)}</div>
					</div>
					<div class="flex items-center justify-between mt-1 text-sm text-primary-300">
						<div class="inline-flex items-center gap-2 px-2 py-0.5 bg-red-100 text-red-600 rounded font-semibold">{getPriceInfo(item).percentOff}% off</div>
						<div class="text-sm">You save {formatClays(getPriceInfo(item).save)}</div>
					</div>
				{:else}
					<div class="mt-3 text-lg font-bold">{formatClays(getPriceInfo(item).price)}</div>
				{/if}
				</div>
			</div>
		{/each}
	</div>
{/if}

<!-- <p>Market score: {data.user.shopScore}</p> -->
