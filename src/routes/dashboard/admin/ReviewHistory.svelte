<script lang="ts">
	let { reviews } = $props();
</script>

<div class="mb-5 flex flex-col gap-3">
	<h1 class="text-2xl font-bold">T1 reviews</h1>
	{#each reviews.t1Reviews as review}
		<div class="themed-box flex flex-col p-3 shadow-lg">
			<p class="font-bold text-primary-400">{review.action}</p>
			<p class="text-sm"><span class="font-bold">Notes:</span> {review.notes}</p>
			<p class="text-sm"><span class="font-bold">Feedback:</span> {review.feedback}</p>
			<p class="text-xs">
				reviewed by <a href={`../../users/${review.user.id}`} class="underline"
					>{review.user.name}</a
				>
			</p>
		</div>
	{/each}
	<h1 class="text-2xl font-bold">Legion actions</h1>
	{#each reviews.legionReviews as review}
		<div class="themed-box flex flex-col p-3 shadow-lg">
			<p class="font-bold text-primary-400">{review.action}</p>
			{#if review.notes}
				<p class="text-sm"><span class="font-bold">Notes:</span> {review.notes}</p>
			{/if}
			{#if review.feedback}
				<p class="text-sm"><span class="font-bold">Feedback:</span> {review.feedback}</p>
			{/if}
			{#if review.filamentUsed}
				<p class="text-sm"><span class="font-bold">Filament used:</span> {review.filamentUsed}g</p>
			{/if}
			<p class="text-xs">
				by <a href={`../../users/${review.user.id}`} class="underline">{review.user.name}</a>
			</p>
		</div>
	{/each}
	<h1 class="text-2xl font-bold">T2 reviews</h1>
	{#each reviews.t2Reviews as review}
		<div class="themed-box flex flex-col p-3 shadow-lg">
			{#if review.notes}
				<p class="text-sm"><span class="font-bold">Notes:</span> {review.notes}</p>
			{/if}
			{#if review.feedback}
				<p class="text-sm"><span class="font-bold">Feedback:</span> {review.feedback}</p>
			{/if}
			{#if review.image}
				<p class="text-sm"><span class="font-bold">Image:</span> {review.image}</p>
			{/if}
			<p class="text-sm">
				<span class="font-bold">Market score per hour:</span> {review.shopScoreMultiplier}
			</p>
			<p class="text-xs">
				by <a href={`../../users/${review.user.id}`} class="underline">{review.user.name}</a>
			</p>
		</div>
	{/each}
</div>
