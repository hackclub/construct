<script lang="ts">
	import Head from '$lib/components/Head.svelte';
	import { enhance } from '$app/forms';
	import MarketItem from '../../../MarketItem.svelte';

	let { data } = $props();

	let formPending = $state(false);
</script>

<Head title="Delete market item" />

<h1 class="mt-5 mb-3 font-hero text-3xl">Delete market item</h1>

<div class="mb-3 grid grid-cols-3">
	<MarketItem item={data.marketItem} showButtons={false} />
</div>

<form
	method="POST"
	class="mb-5 flex flex-col gap-3"
	use:enhance={() => {
		formPending = true;
		return async ({ update }) => {
			await update();
			formPending = false;
		};
	}}
>
	<p>Are you sure you want to delete this? If possible, make it private instead.</p>
	<div class="flex gap-2">
		<a href="../.." class="button primary md">Cancel</a>
		<button type="submit" class="button dark-red md" disabled={formPending}>Delete</button>
	</div>
</form>
