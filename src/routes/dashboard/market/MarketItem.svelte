<script lang="ts">
	let { item, userShopScore } = $props();
</script>

<!-- <div
	class={`themed-box relative flex flex-col p-3 shadow-lg/20 transition-all ${url ? 'hover:scale-102' : ''}`}
>
	{#if url}
		<a class="absolute inset-0 z-1" href={url} aria-label="Market item"></a>
	{/if}
	<div>
		
	</div>
</div> -->

<div class="themed-box flex flex-col gap-3 p-3">
	<div class="aspect-square overflow-hidden rounded-lg bg-primary-800/10">
		<img src={item.image} alt={item.name} class="h-full w-full object-contain object-center" />
	</div>
	<div class="flex flex-col gap-2 grow">
		<div class="grow">
			<h3 class="text-xl font-bold">{item.name}</h3>
			<p class="mb-1 leading-snug text-primary-300">{item.description}</p>
			{#if item.discountAmount > 0}
				<div class="flex items-center gap-2">
					<div class="text-lg text-primary-300 line-through">{item.maxPrice} bricks</div>
					<div class="text-lg font-bold text-emerald-500">
						{item.computedPrice} bricks
					</div>
				</div>
				<div class="mt-1 flex items-center justify-between text-sm text-primary-300">
					<div
						class="inline-flex items-center gap-2 rounded bg-red-100 px-2 py-0.5 font-semibold text-red-600"
					>
						{Math.round(item.discountAmount * 100)}% off
					</div>
					<div class="text-sm">You save {item.maxPrice - item.computedPrice} bricks</div>
				</div>
			{:else}
				<div class="text-lg font-bold">{item.computedPrice} bricks</div>
			{/if}
			{#if item.minRequiredShopScore > userShopScore}
				<div class="text-sm">
					{item.minRequiredShopScore - userShopScore} more market score needed
				</div>
			{/if}
		</div>
		<a href={`market/${item.id}`} class={`button md primary`}>Buy</a>
	</div>
</div>
