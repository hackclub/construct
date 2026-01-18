<script lang="ts">
	import { enhance } from '$app/forms';
	import Head from '$lib/components/Head.svelte';
	import PrinterCard from './PrinterCard.svelte';

	let { data } = $props();

	let selectedBase = $state(data.preferredPrinter?.id || null);
	let selectedUpgrades = $state<number[]>([]);

	let formPending = $state(false);

	$effect(() => {
		if (data.preferredPrinter && !selectedBase) {
			selectedBase = data.preferredPrinter.id;
		}
	});

	$effect(() => {
		if (!selectedBase) {
			selectedUpgrades = [];
		}
	});

	let totalClay = $derived(
		selectedBase && data.preferredPrinter ? data.preferredPrinter.clayPrice || 40 : 0
	);
	let totalBricks = $derived(
		selectedUpgrades.reduce((sum, id) => {
			const upgrade = data.upgrades.find(u => u.id === id);
			return sum + (upgrade?.computedPrice || 0);
		}, 0)
	);

	let canAfford = $derived(
		totalClay <= data.user.clay && totalBricks <= data.user.brick
	);

	let hasEnoughScore = $derived(() => {
		if (selectedBase && data.preferredPrinter) {
			if (data.preferredPrinter.minRequiredShopScore > data.user.shopScore) return false;
		}
		for (const id of selectedUpgrades) {
			const upgrade = data.upgrades.find(u => u.id === id);
			if (upgrade && upgrade.minRequiredShopScore > data.user.shopScore) return false;
		}
		return true;
	});

	let userDataError = $state(false);
	let addresses = $state(data.addresses || []);
</script>

<Head title="Printer Market" />

{#if data.hasBasePrinter}
	<div class="themed-box p-6 text-center">
		<h2 class="text-2xl font-bold mb-4">You Already Have a Printer</h2>
		<p>You can only have one printer.</p>
	</div>
{:else}

<h1 class="mt-5 mb-4 font-hero text-3xl font-medium">Printer Market</h1>

{#if !data.preferredPrinter}
	<div class="mb-6">
		<h2 class="mb-3 text-2xl font-bold">Choose a printer</h2>
		<p class="mb-4 text-primary-300">
			Choose which printer you'd like to get. You can always change your preferred printer later
		</p>

		<div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
			{#each data.basePrinters as printer (printer.id)}
				<form method="POST" action="?/selectPrinter" use:enhance class="h-full">
					<input type="hidden" name="printerId" value={printer.id} />
					<button type="submit" class="w-full text-left h-full transition-transform hover:scale-[1.02]">
						<PrinterCard 
							item={printer} 
							curr="clay"
						>
							<div class="button md primary w-full">Select This Printer</div>
						</PrinterCard>
					</button>
				</form>
			{/each}
		</div>
	</div>
{:else}
	<div class="mb-6">
		<div class="mb-4 flex items-center justify-between">
			<h2 class="text-2xl font-bold">Your Selected Printer: {data.preferredPrinter.name}</h2>
			{#if !data.hasOrderedBasePrinter}
				<form method="POST" action="?/selectPrinter" use:enhance>
					<input type="hidden" name="printerId" value="" />
					<button type="submit" class="button sm secondary">Change Printer</button>
				</form>
			{/if}
		</div>

		{#if !data.user.hasBasePrinter && !data.hasOrderedBasePrinter}
			<div class="mb-6">
				<h3 class="mb-3 text-xl font-bold">Base Printer</h3>
				<div class="themed-box flex flex-row gap-4 p-4">
					<div class="w-64 flex-shrink-0">
						<div class="aspect-square overflow-hidden rounded-lg bg-primary-800/10">
							<img
								src={data.preferredPrinter.image}
								alt={data.preferredPrinter.name}
								class="h-full w-full object-contain object-center"
							/>
						</div>
					</div>
					<div class="flex grow flex-col gap-3">
						<div>
							<h3 class="text-2xl font-bold">{data.preferredPrinter.name}</h3>
							<p class="mt-2 leading-snug text-primary-300">
								{data.preferredPrinter.description}
							</p>
						</div>
						<div class="text-xl font-bold">{data.preferredPrinter.clayPrice || 40} clay</div>
						<div class="mt-auto">
							{#if selectedBase === data.preferredPrinter.id}
								<span class="text-green-500 font-bold">Added to cart</span>
							{:else if data.preferredPrinter.minRequiredShopScore > data.user.shopScore}
								<button disabled class="button md primary disabled">
									{data.preferredPrinter.minRequiredShopScore - data.user.shopScore} more market score
									needed
								</button>
							{:else if (data.preferredPrinter.clayPrice || 40) > data.user.clay}
								<button disabled class="button md primary disabled">
									{(data.preferredPrinter.clayPrice || 40) - data.user.clay} more clay needed
								</button>
							{:else}
								<button
									class="button md primary"
									onclick={() => (selectedBase = data.preferredPrinter.id)}
								>
									Add to cart
								</button>
							{/if}
						</div>
					</div>
				</div>
			</div>
		{/if}

		{#if data.upgrades.length > 0}
			<h3 class="mb-3 text-xl font-bold">Available Upgrades</h3>
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
				{#each data.upgrades as upgrade (upgrade.id)}
					{#if selectedBase}
						<PrinterCard item={upgrade} curr="bricks">
							{#if selectedUpgrades.includes(upgrade.id)}
								<button
									class="button md secondary w-full"
									onclick={() => (selectedUpgrades = selectedUpgrades.filter(id => id !== upgrade.id))}
								>
									Remove from cart
								</button>
							{:else if upgrade.minRequiredShopScore > data.user.shopScore}
								<button disabled class="button md primary disabled w-full">
									{upgrade.minRequiredShopScore - data.user.shopScore} more market score needed
								</button>
							{:else if upgrade.computedPrice > data.user.brick}
								<button disabled class="button md primary disabled w-full">
									{upgrade.computedPrice - data.user.brick} more bricks needed
								</button>
							{:else}
								<button
									class="button md primary w-full"
									onclick={() => (selectedUpgrades = [...selectedUpgrades, upgrade.id])}
								>
									Add to cart
								</button>
							{/if}
						</PrinterCard>
					{:else}
						<div class="h-full opacity-60">
							<PrinterCard item={upgrade} curr="bricks">
								<button disabled class="button md primary disabled w-full">
									Select base printer first
								</button>
							</PrinterCard>
						</div>
					{/if}
				{/each}
			</div>
		{:else if selectedBase}
			<p class="rounded-lg bg-primary-800 p-3 text-primary-300">
				No upgrades available for this printer yet.
			</p>
		{:else}
			<p class="rounded-lg bg-primary-800 p-3 text-primary-300">
				Select a base printer above to see available upgrades.
			</p>
		{/if}

		{#if selectedBase || selectedUpgrades.length > 0}
			<div class="mt-6">
				<h3 class="mb-3 text-xl font-bold">Cart</h3>
				<div class="themed-box p-4">
					{#if selectedBase}
						<div class="mb-2">
							<strong>Base Printer:</strong> {data.preferredPrinter.name} ({totalClay} clay)
						</div>
					{/if}
					{#if selectedUpgrades.length > 0}
						<div class="mb-2">
							<strong>Upgrades:</strong>
							<ul class="list-disc list-inside">
								{#each selectedUpgrades as id}
									{@const upgrade = data.upgrades.find(u => u.id === id)}
									<li>{upgrade?.name} ({upgrade?.computedPrice ?? upgrade?.maxPrice} bricks)</li>
								{/each}
							</ul>
						</div>
					{/if}
					<div class="mb-4">
						<strong>Total:</strong> {totalClay} clay + {totalBricks} bricks
					</div>

					<form method="POST" action="?/checkout" use:enhance>
						<input type="hidden" name="baseId" value={selectedBase || ''} />
						<input type="hidden" name="upgradeIds" value={JSON.stringify(selectedUpgrades)} />
						<button type="submit" class="button md primary" disabled={!canAfford || !hasEnoughScore || formPending}>
							{#if !hasEnoughScore}
								Not enough market score
							{:else if !canAfford}
								Not enough resources
							{:else}
							Checkout
							{/if}
						</button>
					</form>
				</div>
			</div>
		{/if}
	</div>
{/if}
{/if}
