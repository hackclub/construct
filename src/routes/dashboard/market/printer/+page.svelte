<script lang="ts">
	import { enhance } from '$app/forms';
	import Head from '$lib/components/Head.svelte';
	import PrinterCard from './PrinterCard.svelte';

	let { data } = $props();
</script>

<Head title="Printer Market" />

<h1 class="mt-5 mb-4 font-hero text-3xl font-medium">Printer Market</h1>

{#if !data.preferredPrinter}
	<div class="mb-6">
		<h2 class="mb-3 text-2xl font-bold">Choose a printer</h2>
		<p class="mb-4 text-primary-300">
			Choose which printer you'd like to get. You can always change your preferred printer later
		</p>

		<div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
			{#each data.basePrinters as printer (printer.id)}
				<form method="POST" action="?/selectPrinter" use:enhance>
					<input type="hidden" name="printerId" value={printer.id} />
					<button type="submit" class="w-full text-left">
						<div class="themed-box flex flex-col gap-3 p-3 transition-all">
							<div class="aspect-square overflow-hidden rounded-lg bg-primary-800/10">
								<img
									src={printer.image}
									alt={printer.name}
									class="h-full w-full object-contain object-center"
								/>
							</div>
							<div class="flex grow flex-col gap-2">
								<h3 class="text-center text-xl font-bold">{printer.name}</h3>
								<p class="mb-1 text-center leading-snug text-primary-300">
									{printer.description}
								</p>
								<div class="text-center text-lg font-bold">Base: 40 clay</div>
								<div class="button md primary">Select this printer</div>
							</div>
						</div>
					</button>
				</form>
			{/each}
		</div>
	</div>
{:else}
	<div class="mb-6">
		<div class="mb-4 flex items-center justify-between">
			<h2 class="text-2xl font-bold">Chosen printer: {data.preferredPrinter.name}</h2>
			{#if !data.hasOrderedBasePrinter}
				<form method="POST" action="?/selectPrinter" use:enhance>
					<input type="hidden" name="printerId" value="" />
					<button type="submit" class="button sm primary">Change Printer</button>
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
							{#if data.preferredPrinter.minRequiredShopScore > data.user.shopScore}
								<button disabled class="button md primary disabled">
									{data.preferredPrinter.minRequiredShopScore - data.user.shopScore} more market score
									needed
								</button>
							{:else if (data.preferredPrinter.clayPrice || 40) > data.user.clay}
								<button disabled class="button md primary disabled">
									{(data.preferredPrinter.clayPrice || 40) - data.user.clay} more clay needed
								</button>
							{:else}
								<a href={`printer/${data.preferredPrinter.id}?type=base`} class="button md primary">
									Buy for {data.preferredPrinter.clayPrice || 40} clay
								</a>
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
					{#if data.hasOrderedBasePrinter}
						<PrinterCard
							printer={upgrade}
							userShopScore={data.user.shopScore}
							userClay={data.user.clay}
							userBrick={data.user.brick}
							isBasePrinter={false}
							userHasBasePrinter={data.user.hasBasePrinter}
						/>
					{:else}
						<div class="themed-box flex flex-col gap-3 p-3 opacity-60">
							<div class="aspect-square overflow-hidden rounded-lg bg-primary-800/10">
								<img
									src={upgrade.image}
									alt={upgrade.name}
									class="h-full w-full object-contain object-center"
								/>
							</div>
							<div class="flex grow flex-col gap-2">
								<div class="grow">
									<h3 class="text-center text-xl font-bold">{upgrade.name}</h3>
									<p class="mb-1 text-center leading-snug text-primary-300">
										{upgrade.description}
									</p>

									{#if upgrade.discountAmount > 0}
										<div class="flex items-center justify-between gap-2">
											<div class="text-lg text-primary-300 line-through">
												{upgrade.maxPrice} bricks
											</div>
											<div class="text-lg font-bold text-emerald-500">
												{upgrade.computedPrice} bricks
											</div>
										</div>
										<div class="flex items-center justify-between text-sm text-primary-300">
											<div
												class="inline-flex items-center gap-2 rounded bg-red-100 px-2 py-0.5 font-semibold text-red-600"
											>
												{Math.round(upgrade.discountAmount * 100)}% off
											</div>
											<div class="text-sm">
												You save {upgrade.maxPrice - upgrade.computedPrice} bricks
											</div>
										</div>
									{:else}
										<div class="text-center text-lg font-bold">
											{upgrade.computedPrice ?? upgrade.maxPrice} bricks
										</div>
									{/if}
								</div>
								<div class="flex justify-center">
									<button disabled class="button md primary disabled">
										Buy base printer first
									</button>
								</div>
							</div>
						</div>
					{/if}
				{/each}
			</div>
		{:else if data.hasOrderedBasePrinter}
			<p class="rounded-lg bg-primary-800 p-3 text-primary-300">
				No upgrades available for this printer yet.
			</p>
		{:else}
			<p class="rounded-lg bg-primary-800 p-3 text-primary-300">
				Purchase a base printer above to unlock available upgrades.
			</p>
		{/if}
	</div>
{/if}
