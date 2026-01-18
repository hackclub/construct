<script lang="ts">
	let {
		item,
		curr = 'bricks',
		userBalance = 0,
		userShopScore = 0,
		children
	} = $props();

	// If it's a base printer, the 'price' is clayPrice.
	// If it's an upgrade, the 'price' is computedPrice (bricks).
	// We handle that logic in the parent or pass standardized 'item' objects?
	// The parent passes the raw DB object usually.
	// Let's rely on props passed from parent being correct for display,
	// or standardized.
	// Actually, looking at +page.svelte, "base" printers have manually added props sometimes.

	// Let's standardize the "price" display.
	let displayPrice = $derived(
		curr === 'clay' ? (item.clayPrice || 40) : (item.computedPrice || 0)
	);

	let maxPrice = $derived(item.maxPrice || 0);
	let discount = $derived(item.discountAmount || 0);

	// Determine if we show a discount (only valid for upgrades usually)
	let showDiscount = $derived(curr !== 'clay' && discount > 0);
</script>

<div class="themed-box flex flex-col gap-3 p-3 h-full">
	<div class="aspect-square overflow-hidden rounded-lg bg-primary-800/10">
		<img src={item.image} alt={item.name} class="h-full w-full object-contain object-center" />
	</div>
	<div class="flex grow flex-col gap-2">
		<div class="grow">
			<h3 class="text-center text-xl font-bold">{item.name}</h3>
			<p class="mb-1 text-center leading-snug text-primary-300">{item.description}</p>

			{#if showDiscount}
				<div class="flex items-center justify-between gap-2">
					<div class="text-lg text-primary-300 line-through">{maxPrice} {curr}</div>
					<div class="text-lg font-bold text-emerald-500">
						{displayPrice} {curr}
					</div>
				</div>
				<div class="flex items-center justify-between text-sm text-primary-300">
					<div
						class="inline-flex items-center gap-2 rounded bg-red-100 px-2 py-0.5 font-semibold text-red-600"
					>
						{Math.round(discount * 100)}% off
					</div>
					<div class="text-sm">You save {maxPrice - displayPrice} {curr}</div>
				</div>
			{:else}
				<div class="text-center text-lg font-bold">{displayPrice} {curr}</div>
			{/if}
		</div>
		
		<div class="flex justify-center flex-col gap-2">
			{@render children?.()}
		</div>
	</div>
</div>
