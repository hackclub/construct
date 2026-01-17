<script lang="ts">
	import Head from '$lib/components/Head.svelte';

	let { data } = $props();

	let publicBasePrinters = $derived(
		data.printers
			.filter((p: any) => !p.requiresId && p.isPublic)
			.sort((a: any, b: any) => a.clayPrice - b.clayPrice)
	);

	let privateBasePrinters = $derived(
		data.printers
			.filter((p: any) => !p.requiresId && !p.isPublic)
			.sort((a: any, b: any) => a.clayPrice - b.clayPrice)
	);

	let publicUpgrades = $derived(
		data.printers
			.filter((p: any) => p.requiresId && p.isPublic)
			.sort((a: any, b: any) => a.maxPrice - b.maxPrice)
	);

	let privateUpgrades = $derived(
		data.printers
			.filter((p: any) => p.requiresId && !p.isPublic)
			.sort((a: any, b: any) => a.maxPrice - b.maxPrice)
	);

	let showCreateForm = $state(false);
	let editingId: number | null = $state(null);
	let formType = $state<'base' | 'upgrade'>('base');

	let form = $state({
		name: '',
		description: '',
		image: '',
		clayPrice: 40,
		minPrice: 0,
		maxPrice: 0,
		minShopScore: 0,
		maxShopScore: 0,
		minRequiredShopScore: 0,
		requiresId: '',
		isPublic: true
	});

	function resetForm() {
		form = {
			name: '',
			description: '',
			image: '',
			clayPrice: 40,
			minPrice: 0,
			maxPrice: 0,
			minShopScore: 0,
			maxShopScore: 0,
			minRequiredShopScore: 0,
			requiresId: '',
			isPublic: true
		};
		editingId = null;
		showCreateForm = false;
	}

	function startEdit(p: any) {
		editingId = p.id;
		formType = !p.requiresId ? 'base' : 'upgrade';
		form = {
			name: p.name,
			description: p.description,
			image: p.image,
			clayPrice: p.clayPrice || 40,
			minPrice: p.minPrice || 0,
			maxPrice: p.maxPrice || 0,
			minShopScore: p.minShopScore || 0,
			maxShopScore: p.maxShopScore || 0,
			minRequiredShopScore: p.minRequiredShopScore || 0,
			requiresId: p.requiresId?.toString() || '',
			isPublic: p.isPublic
		};
		showCreateForm = true;
	}

	function handleDelete(id: number) {
		if (!confirm('Are you sure?')) return;
		const form = document.querySelector(`form[data-id="${id}"]`) as HTMLFormElement;
		form?.submit();
	}
</script>

<Head title="Printer Manager" />

<h1 class="mt-5 mb-5 font-hero text-3xl font-medium">Printer Manager</h1>

<div class="flex flex-row mb-5">
	<button
		onclick={() => {
			showCreateForm = !showCreateForm;
			if (!showCreateForm) resetForm();
		}}
		class="button primary md"
	>
		{showCreateForm ? 'Cancel' : '+ Add Printer/Upgrade'}
	</button>
</div>

{#if showCreateForm}
	<div class="themed-box mb-6 p-6">
		<h2 class="mb-4 text-2xl font-bold">{editingId ? 'Edit Printer' : 'Create New Printer'}</h2>

		<form
			method="POST"
			action={editingId ? '?/update' : '?/create'}
			class="space-y-4"
		>
			{#if editingId}
				<input type="hidden" name="id" value={editingId} />
			{/if}

			<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
				<label class="block">
					<span class="mb-1 block font-semibold">Name</span>
					<input
						type="text"
						name="name"
						bind:value={form.name}
						required
						class="w-full rounded-lg border border-primary-700 bg-primary-900 p-2 text-primary-100"
					/>
				</label>

				<label class="block">
					<span class="mb-1 block font-semibold">Image URL</span>
					<input
						type="text"
						name="image"
						bind:value={form.image}
						required
						class="w-full rounded-lg border border-primary-700 bg-primary-900 p-2 text-primary-100"
					/>
				</label>
			</div>

			<label class="block">
				<span class="mb-1 block font-semibold">Description</span>
				<textarea
					name="description"
					bind:value={form.description}
					required
					class="w-full rounded-lg border border-primary-700 bg-primary-900 p-2 text-primary-100"
					rows="3"
				></textarea>
			</label>

			<div class="flex items-center gap-2 rounded-lg bg-primary-900 p-3">
				<input
					type="checkbox"
					id="isBase"
					checked={formType === 'base'}
					onchange={(e) => {
						formType = (e.target as HTMLInputElement).checked ? 'base' : 'upgrade';
					}}
					class="h-4 w-4"
				/>
				<label for="isBase" class="font-semibold cursor-pointer">Base Printer</label>
			</div>

			{#if formType === 'base'}
				<div class="grid grid-cols-1 gap-4">
					<label class="block">
						<span class="mb-1 block font-semibold">Clay Price</span>
						<input
							type="number"
							name="clayPrice"
							bind:value={form.clayPrice}
							min="1"
							class="w-full rounded-lg border border-primary-700 bg-primary-900 p-2 text-primary-100"
						/>
					</label>
				</div>
			{:else}
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <label class="block">
						<span class="mb-1 block font-semibold">Min Shop Score</span>
						<input
							type="number"
							name="minShopScore"
							bind:value={form.minShopScore}
							min="0"
							class="w-full rounded-lg border border-primary-700 bg-primary-900 p-2 text-primary-100"
						/>
					</label>
					<label class="block">
						<span class="mb-1 block font-semibold">Max Shop Score</span>
						<input
							type="number"
							name="maxShopScore"
							bind:value={form.maxShopScore}
							min="0"
							class="w-full rounded-lg border border-primary-700 bg-primary-900 p-2 text-primary-100"
						/>
					</label>
                    <label class="block">
						<span class="mb-1 block font-semibold">Max Price (bricks)</span>
						<input
							type="number"
							name="maxPrice"
							bind:value={form.maxPrice}
							min="0"
							class="w-full rounded-lg border border-primary-700 bg-primary-900 p-2 text-primary-100"
						/>
					</label>
					<label class="block">
						<span class="mb-1 block font-semibold">Min Price (bricks)</span>
						<input
							type="number"
							name="minPrice"
							bind:value={form.minPrice}
							min="0"
							class="w-full rounded-lg border border-primary-700 bg-primary-900 p-2 text-primary-100"
						/>
					</label>
					<label class="block">
						<span class="mb-1 block font-semibold">Requires Printer (ID)</span>
						<select
							name="requiresId"
							bind:value={form.requiresId}
							class="w-full rounded-lg border border-primary-700 bg-primary-900 p-2 text-primary-100"
						>
							<option value="">None (Base Printer)</option>
							{#each data.printers.filter((p: any) => !p.requiresId) as basePrinter (basePrinter.id)}
								<option value={basePrinter.id}>{basePrinter.name}</option>
							{/each}
						</select>
					</label>
				</div>
			{/if}

			<label class="block">
				<span class="mb-1 block font-semibold">Min Required Shop Score</span>
				<input
					type="number"
					name="minRequiredShopScore"
					bind:value={form.minRequiredShopScore}
					min="0"
					class="w-full rounded-lg border border-primary-700 bg-primary-900 p-2 text-primary-100"
				/>
			</label>

			<div class="flex items-center gap-2 rounded-lg bg-primary-900 p-3">
				<input
					type="checkbox"
					id="isPublic"
					name="isPublic"
					bind:checked={form.isPublic}
					class="h-4 w-4"
				/>
				<label for="isPublic" class="font-semibold cursor-pointer">Public</label>
			</div>

			<div class="flex gap-2">
				<button
					type="submit"
					class="button md primary"
				>
					{editingId ? 'Update Printer' : 'Create Printer'}
				</button>
				<button
					type="button"
					onclick={resetForm}
					class="button md"
				>
					Cancel
				</button>
			</div>
		</form>
	</div>
{/if}

<div class="mb-5 flex flex-col gap-5">
	<div>
		<h2 class="mb-3 text-2xl font-bold">Base Printers - Public</h2>
		{#if publicBasePrinters.length === 0}
			<p class="text-sm text-primary-300">No public base printers yet.</p>
		{:else}
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
				{#each publicBasePrinters as p (p.id)}
					<div class="themed-box p-3">
						<div class="mb-3 aspect-square overflow-hidden rounded-lg bg-primary-800/10">
							<img src={p.image} alt={p.name} class="h-full w-full object-contain object-center" />
						</div>
						<h3 class="text-lg font-bold">{p.name}</h3>
						<p class="mb-1 text-sm">{p.description}</p>
						<p class="text-sm text-primary-200">Price: {p.clayPrice} clay</p>
						<p class="text-sm text-primary-200">Min score required: {p.minRequiredShopScore}</p>

						<div class="flex gap-2 mt-3">
							<button
								type="button"
								onclick={() => startEdit(p)}
								class="button primary md flex-1"
							>
								Edit
							</button>
							<form method="POST" action="?/delete" data-id={p.id} style="display: inline; flex: 1;">
								<input type="hidden" name="id" value={p.id} />
								<button
									type="button"
									class="button red md w-full"
									onclick={() => handleDelete(p.id)}
								>
									Delete
								</button>
							</form>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<div>
		<h2 class="mb-3 text-2xl font-bold">Base Printers - Private</h2>
		{#if privateBasePrinters.length === 0}
			<p class="text-sm text-primary-300">No private base printers.</p>
		{:else}
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
				{#each privateBasePrinters as p (p.id)}
					<div class="themed-box p-3">
						<div class="mb-3 aspect-square overflow-hidden rounded-lg bg-primary-800/10">
							<img src={p.image} alt={p.name} class="h-full w-full object-contain object-center" />
						</div>
						<h3 class="text-lg font-bold">{p.name}</h3>
						<p class="mb-1 text-sm">{p.description}</p>
						<p class="text-sm text-primary-200">Price: {p.clayPrice} clay</p>
						<p class="text-sm text-primary-200">Min score required: {p.minRequiredShopScore}</p>

						<div class="flex gap-2 mt-3">
							<button
								type="button"
								onclick={() => startEdit(p)}
								class="button primary md flex-1"
							>
								Edit
							</button>
							<form method="POST" action="?/delete" data-id={p.id} style="display: inline; flex: 1;">
								<input type="hidden" name="id" value={p.id} />
								<button
									type="button"
									class="button red md w-full"
									onclick={() => handleDelete(p.id)}
								>
									Delete
								</button>
							</form>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<div>
		<h2 class="mb-3 text-2xl font-bold">Upgrades - Public</h2>
		{#if publicUpgrades.length === 0}
			<p class="text-sm text-primary-300">No public upgrades yet.</p>
		{:else}
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
				{#each publicUpgrades as p (p.id)}
					<div class="themed-box p-3">
						<div class="mb-3 aspect-square overflow-hidden rounded-lg bg-primary-800/10">
							<img src={p.image} alt={p.name} class="h-full w-full object-contain object-center" />
						</div>
						<h3 class="text-lg font-bold">{p.name}</h3>
						<p class="mb-1 text-sm">{p.description}</p>
						<p class="text-sm text-primary-200">Price: {p.minPrice}-{p.maxPrice} bricks</p>
						<p class="text-sm text-primary-200">Score: {p.minShopScore}-{p.maxShopScore}</p>

						<div class="flex gap-2 mt-3">
							<button
								type="button"
								onclick={() => startEdit(p)}
								class="button primary md flex-1"
							>
								Edit
							</button>
							<form method="POST" action="?/delete" data-id={p.id} style="display: inline; flex: 1;">
								<input type="hidden" name="id" value={p.id} />
								<button
									type="button"
									class="button red md w-full"
									onclick={() => handleDelete(p.id)}
								>
									Delete
								</button>
							</form>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<div>
		<h2 class="mb-3 text-2xl font-bold">Upgrades - Private</h2>
		{#if privateUpgrades.length === 0}
			<p class="text-sm text-primary-300">No private upgrades.</p>
		{:else}
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
				{#each privateUpgrades as p (p.id)}
					<div class="themed-box p-3">
						<div class="mb-3 aspect-square overflow-hidden rounded-lg bg-primary-800/10">
							<img src={p.image} alt={p.name} class="h-full w-full object-contain object-center" />
						</div>
						<h3 class="text-lg font-bold">{p.name}</h3>
						<p class="mb-1 text-sm">{p.description}</p>
						<p class="text-sm text-primary-200">Price: {p.minPrice}-{p.maxPrice} bricks</p>
						<p class="text-sm text-primary-200">Score: {p.minShopScore}-{p.maxShopScore}</p>

						<div class="flex gap-2 mt-3">
							<button
								type="button"
								onclick={() => startEdit(p)}
								class="button primary md flex-1"
							>
								Edit
							</button>
							<form method="POST" action="?/delete" data-id={p.id} style="display: inline; flex: 1;">
								<input type="hidden" name="id" value={p.id} />
								<button
									type="button"
									class="button red md w-full"
									onclick={() => handleDelete(p.id)}
								>
									Delete
								</button>
							</form>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
