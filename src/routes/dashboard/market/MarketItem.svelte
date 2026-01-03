<script lang="ts">
	let { item, userShopScore, userBricks, showBuy = true } = $props();

	let disableBuy = $derived(
		item.minRequiredShopScore > userShopScore || item.computedPrice > userBricks
	);
</script>

<div class="themed-box flex flex-col gap-3 p-3">
	<div class="aspect-square overflow-hidden rounded-lg bg-primary-800/10">
		<img src={item.image} alt={item.name} class="h-full w-full object-contain object-center" />
	</div>
	<div class="flex grow flex-col gap-2">
		<div class="grow">
			<h3 class="text-center text-xl font-bold">{item.name}</h3>
			<p class="mb-1 text-center leading-snug text-primary-300">{item.description}</p>
			{#if item.discountAmount > 0}
				<div class="flex items-center justify-between gap-2">
					<div class="text-lg text-primary-300 line-through">{item.maxPrice} bricks</div>
					<div class="text-lg font-bold text-emerald-500">
						{item.computedPrice} bricks
					</div>
				</div>
				<div class="flex items-center justify-between text-sm text-primary-300">
					<div
						class="inline-flex items-center gap-2 rounded bg-red-100 px-2 py-0.5 font-semibold text-red-600"
					>
						{Math.round(item.discountAmount * 100)}% off
					</div>
					<div class="text-sm">You save {item.maxPrice - item.computedPrice} bricks</div>
				</div>
			{:else}
				<div class="text-center text-lg font-bold">{item.computedPrice} bricks</div>
			{/if}
		</div>
		{#if showBuy}
			<div>
				<a
					href={disableBuy ? null : `market/item/${item.id}`}
					class={`button md primary ${disableBuy ? 'disabled' : ''}`}
				>
					{#if item.minRequiredShopScore > userShopScore}
						{Math.ceil(item.minRequiredShopScore - userShopScore)} more market score needed
					{:else if item.computedPrice > userBricks}
						{item.computedPrice - Math.floor(userBricks)} more bricks needed
					{:else}
						Buy for {item.computedPrice} bricks
					{/if}
				</a>
			</div>
		{/if}
	</div>
</div>
