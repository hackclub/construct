<script lang="ts">
	import { enhance } from '$app/forms';
	import Head from '$lib/components/Head.svelte';

	let { data } = $props();

	let formPending = $state(false);
	let disableBuy = $derived(
		data.printerData.minRequiredShopScore > data.user.shopScore ||
			(data.isBase
				? data.printerData.clayPrice > data.user.clay || data.userDataError || !data.addresses?.length
				: (data.printerData.computedPrice ?? data.printerData.maxPrice) > data.user.brick)
	);
</script>

<Head title="Buy printer" />

<h1 class="mt-5 mb-3 font-hero text-3xl font-medium">Buy?</h1>

<div class="mb-5 flex flex-row gap-5">
	{#if data.isBase}
		<div class="w-100">
			<div class="themed-box flex flex-col gap-3 p-3">
				<div class="aspect-square overflow-hidden rounded-lg bg-primary-800/10">
					<img
						src={data.printerData.image}
						alt={data.printerData.name}
						class="h-full w-full object-contain object-center"
					/>
				</div>
				<div class="flex grow flex-col gap-2">
					<div class="grow">
						<h3 class="text-center text-xl font-bold">{data.printerData.name}</h3>
						<p class="mb-1 text-center leading-snug text-primary-300">
							{data.printerData.description}
						</p>
						<div class="text-center text-lg font-bold">{data.printerData.clayPrice} clay</div>
					</div>
				</div>
			</div>
		</div>
	{:else}
		<div class="w-100">
			<div class="themed-box flex flex-col gap-3 p-3">
				<div class="aspect-square overflow-hidden rounded-lg bg-primary-800/10">
					<img
						src={data.printerData.image}
						alt={data.printerData.name}
						class="h-full w-full object-contain object-center"
					/>
				</div>
				<div class="flex grow flex-col gap-2">
					<div class="grow">
						<h3 class="text-center text-xl font-bold">{data.printerData.name}</h3>
						<p class="mb-1 text-center leading-snug text-primary-300">
							{data.printerData.description}
						</p>

						{#if data.printerData.discountAmount > 0}
							<div class="flex items-center justify-between gap-2">
								<div class="text-lg text-primary-300 line-through">
									{data.printerData.maxPrice} bricks
								</div>
								<div class="text-lg font-bold text-emerald-500">
									{data.printerData.computedPrice} bricks
								</div>
							</div>
							<div class="flex items-center justify-between text-sm text-primary-300">
								<div
									class="inline-flex items-center gap-2 rounded bg-red-100 px-2 py-0.5 font-semibold text-red-600"
								>
									{Math.round(data.printerData.discountAmount * 100)}% off
								</div>
								<div class="text-sm">
									You save {data.printerData.maxPrice - data.printerData.computedPrice} bricks
								</div>
							</div>
						{:else}
							<div class="text-center text-lg font-bold">
								{data.printerData.computedPrice ?? data.printerData.maxPrice} bricks
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
	{/if}

	<div class="themed-box flex grow flex-col p-3">
		<h1 class="mb-1 text-2xl font-bold">Are you sure you want to buy this?</h1>
		<p class="mb-2">
			{#if data.isBase}
				It'll cost you {data.printerData.clayPrice} clay
			{:else}
				It'll cost you {data.printerData.computedPrice ?? data.printerData.maxPrice} bricks
			{/if}
		</p>

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
						>(fetched from <a
							href="https://auth.hackclub.com"
							target="_blank"
							class="underline">auth.hackclub.com</a
						>)</span
					></span
				>
				<select class="themed-input-on-box text-sm" name="address" required={data.isBase}>
					{#if data.userDataError}
						<option disabled selected
							>Failed to fetch addresses, try logging out and back in</option
						>
					{:else if !data.addresses?.length}
						<option disabled selected>Go to auth.hackclub.com and add an address</option>
					{:else}
						{#each data.addresses.sort((a, b) => {
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
				{#if data.printerData.minRequiredShopScore > data.user.shopScore}
					{data.printerData.minRequiredShopScore - data.user.shopScore} more market score needed
				{:else if data.isBase && data.printerData.clayPrice > data.user.clay}
					{data.printerData.clayPrice - data.user.clay} more clay needed
				{:else if !data.isBase && (data.printerData.computedPrice ?? data.printerData.maxPrice) > data.user.brick}
					{(data.printerData.computedPrice ?? data.printerData.maxPrice) - data.user.brick} more bricks
					needed
				{:else if data.isBase}
					Buy for {data.printerData.clayPrice} clay
				{:else}
					Buy for {data.printerData.computedPrice ?? data.printerData.maxPrice} bricks
				{/if}
			</button>
		</form>
	</div>
</div>
