<script lang="ts">
	import { enhance } from '$app/forms';
	import Head from '$lib/components/Head.svelte';
	import MarketItem from '../../MarketItem.svelte';

	let { data } = $props();

	let formPending = $state(false);
	let disableBuy = $derived(
		data.marketItem.minRequiredShopScore > data.user.shopScore ||
			data.marketItem.computedPrice > data.user.brick ||
			data.userDataError ||
			!data.addresses ||
			!data.addresses?.length ||
			data.addresses.length <= 0
	);
</script>

<Head title="Buy item" />

<h1 class="mt-5 mb-3 font-hero text-3xl font-medium">Buy?</h1>

<div class="mb-5 flex flex-row gap-5">
	<div class="w-100">
		<MarketItem
			item={data.marketItem}
			userShopScore={data.user.shopScore}
			userBricks={data.user.brick}
			showBuy={false}
		/>
	</div>

	<div class="themed-box flex grow flex-col p-3">
		<h1 class="mb-1 text-2xl font-bold">Are you sure you want to buy this?</h1>
		<p class="mb-2">It'll cost you {data.marketItem.computedPrice} bricks</p>

		<form
			method="POST"
			class="flex grow flex-col gap-3"
			use:enhance={() => {
				formPending = true;
				return async ({ update }) => {
					await update();
					formPending = false;
				};
			}}
		>
			<label class="flex flex-col gap-1">
				<span class="font-medium"
					>Address <span class="font-medium opacity-60"
						>(fetched from <a href="https://auth.hackclub.com" target="_blank" class="underline"
							>auth.hackclub.com</a
						>)</span
					></span
				>
				<select class="themed-input-on-box text-sm" name="address" required>
					{#if data.userDataError}
						<option disabled selected>Failed to fetch addresses, try logging out and back in</option
						>
					{:else if !data.addresses || !data.addresses?.length || data.addresses.length <= 0}
						<option disabled selected>Go to auth.hackclub.com and add an address</option>
					{:else}
						{#each data.addresses.sort((a: { primary: boolean }, b: { primary: boolean }) => {
							if (a.primary) {
								return -1;
							} else if (b.primary) {
								return 1;
							} else {
								return 0;
							}
						}) as address}
							<option value={address.id}
								>{address.line_1}, {address.line_2 ? address.line_2 + ', ' : ''}
								{address.city},
								{address.state},
								{address.country},
								{address.postal_code}
							</option>
						{/each}
					{/if}
				</select>
			</label>

			<label class="flex flex-col gap-1">
				<span class="font-medium"
					>Notes for fulfilment <span class="opacity-50">(optional)</span></span
				>
				<textarea name="notes" class="themed-input-on-box"></textarea>
			</label>

			<div class="grow"></div>

			<button type="submit" class="button md primary" disabled={disableBuy || formPending}>
				{#if data.marketItem.minRequiredShopScore > data.user.shopScore}
					{data.marketItem.minRequiredShopScore - data.user.shopScore} more market score needed
				{:else if data.marketItem.computedPrice > data.user.brick}
					{data.marketItem.computedPrice - data.user.brick} more bricks needed
				{:else}
					Buy for {data.marketItem.computedPrice} bricks
				{/if}
			</button>
		</form>
	</div>
</div>
