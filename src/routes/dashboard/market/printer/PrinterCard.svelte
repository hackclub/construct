<script lang="ts">
	let { printer, userShopScore, userClay, userBrick, isBasePrinter, userHasBasePrinter } = $props();

	let disableBuy = $derived(
		printer.minRequiredShopScore > userShopScore ||
			(isBasePrinter ? printer.clayPrice > userClay : printer.computedPrice > userBrick)
	);

	const price = isBasePrinter ? printer.clayPrice : printer.computedPrice;
	const currency = isBasePrinter ? 'clay' : 'bricks';
</script>

<div class="themed-box flex flex-col gap-3 p-3">
	<div class="aspect-square overflow-hidden rounded-lg bg-primary-800/10">
		<img src={printer.image} alt={printer.name} class="h-full w-full object-contain object-center" />
	</div>
	<div class="flex grow flex-col gap-2">
		<div class="grow">
			<h3 class="text-center text-xl font-bold">{printer.name}</h3>
			<p class="mb-1 text-center leading-snug text-primary-300">{printer.description}</p>

			{#if !isBasePrinter && printer.discountAmount > 0}
				<div class="flex items-center justify-between gap-2">
					<div class="text-lg text-primary-300 line-through">{printer.maxPrice} bricks</div>
					<div class="text-lg font-bold text-emerald-500">
						{printer.computedPrice} bricks
					</div>
				</div>
				<div class="flex items-center justify-between text-sm text-primary-300">
					<div
						class="inline-flex items-center gap-2 rounded bg-red-100 px-2 py-0.5 font-semibold text-red-600"
					>
						{Math.round(printer.discountAmount * 100)}% off
					</div>
					<div class="text-sm">You save {printer.maxPrice - printer.computedPrice} bricks</div>
				</div>
			{:else}
				<div class="text-center text-lg font-bold">{price} {currency}</div>
			{/if}
		</div>
		<div>
			<a
				href={disableBuy ? null : `printer/${printer.id}${isBasePrinter ? '?type=base' : '?type=upgrade'}`}
				class={`button md primary ${disableBuy ? 'disabled' : ''}`}
			>
				{#if printer.minRequiredShopScore > userShopScore}
					{Math.ceil(printer.minRequiredShopScore - userShopScore)} more market score needed
				{:else if price > (isBasePrinter ? userClay : userBrick)}
					{Math.ceil(price - (isBasePrinter ? userClay : userBrick))} more {currency} needed
				{:else}
					Buy for {price} {currency}
				{/if}
			</a>
		</div>
	</div>
</div>
