<script lang="ts">
	import { enhance } from '$app/forms';
	import Head from '$lib/components/Head.svelte';

	let { data } = $props();

	let formPending = $state(false);
</script>

<Head title="Checkout" />

<h1 class="mt-5 mb-3 font-hero text-3xl font-medium">Checkout</h1>

<div class="mb-5 flex flex-row gap-5">
	<div class="w-100">
		<div class="themed-box flex flex-col gap-3 p-3">
			<div class="aspect-square overflow-hidden rounded-lg bg-primary-800/10">
				<img
					src={data.basePrinter.image}
					alt={data.basePrinter.name}
					class="h-full w-full object-contain object-center"
				/>
			</div>
			<div class="flex grow flex-col gap-2">
				<div class="grow">
					<h3 class="text-center text-xl font-bold">{data.basePrinter.name}</h3>
					<p class="mb-1 text-center leading-snug text-primary-300">
						{data.basePrinter.description}
					</p>
					<div class="text-center text-lg font-bold">{data.basePrinter.clayPrice} clay</div>
				</div>
			</div>
		</div>
	</div>

	<div class="themed-box flex grow flex-col p-3">
		<h1 class="mb-1 text-2xl font-bold">Confirm your order</h1>
		<p class="mb-2">
			Base Printer: {data.basePrinter.name} ({data.basePrinter.clayPrice} clay)
		</p>
		{#if data.upgrades.length > 0}
			<p class="mb-2">Upgrades:</p>
			<ul class="list-disc list-inside mb-2">
				{#each data.upgrades as upgrade}
					<li>{upgrade.name} ({upgrade.computedPrice} bricks)</li>
				{/each}
			</ul>
		{/if}
		<p class="mb-2">
			Total: {data.totalClay} clay + {data.totalBricks} bricks
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
				<select class="themed-input-on-box text-sm" name="address" required>
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

			<input type="hidden" name="baseId" value={data.basePrinter.id} />
			<input type="hidden" name="upgradeIds" value={JSON.stringify(data.upgrades.map(u => u.id))} />

			<div class="grow"></div>

			<button type="submit" class="button md primary" disabled={formPending}>
				Purchase for {data.totalClay} clay + {data.totalBricks} bricks
			</button>
		</form>
	</div>
</div>