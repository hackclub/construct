<script lang="ts">
	import Head from '$lib/components/Head.svelte';
	import { enhance } from '$app/forms';
	import MarketItem from '../../../MarketItem.svelte';

	let { data } = $props();

	let formData = $state(data.marketItem);
	let formPending = $state(false);
</script>

<Head title="Edit market item" />

<h1 class="mt-5 mb-3 font-hero text-3xl">Edit market item</h1>

<div class="mb-3 grid grid-cols-3">
	<MarketItem item={formData} showButtons={false} />
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
	<label class="flex flex-col gap-1">
		Name
		<input
			type="text"
			name="name"
			placeholder="Orpheus"
			required
			bind:value={formData.name}
			class="themed-input w-full"
		/>
	</label>

	<label class="flex flex-col gap-1">
		Description
		<textarea
			name="description"
			placeholder="Get a visit from the holy Orpheus herself"
			required
			bind:value={formData.description}
			class="themed-input w-full"
		></textarea>
	</label>

	<label class="flex flex-col gap-1">
		Image URL
		<input
			type="text"
			name="image"
			placeholder="https://rawr.hackclub.com/DefinetlyNotAI_dino.png"
			required
			bind:value={formData.image}
			class="themed-input w-full"
		/>
	</label>

	<label class="flex flex-col gap-1">
		Min required market score
		<input
			type="number"
			name="minRequiredShopScore"
			required
			bind:value={formData.minRequiredShopScore}
			class="themed-input w-full"
		/>
	</label>

	<div class="flex flex-col gap-1">
		<p class="flex flex-col gap-1">Pricing</p>
		<div class="themed-box flex flex-col gap-3 p-3">
			<div class="flex flex-row gap-3">
				<div class="flex-1">
					<label class="flex flex-col gap-1">
						<span class="text-sm">Min score</span>
						<input
							type="number"
							name="minShopScore"
							required
							min={formData.minRequiredShopScore}
							bind:value={formData.minShopScore}
							class="themed-input-on-box w-full text-center"
						/>
					</label>
				</div>
				<div class="flex-1">
					<label class="flex flex-col gap-1">
						<span class="text-sm">Max score</span>
						<input
							type="number"
							name="maxShopScore"
							required
							min={formData.minShopScore}
							bind:value={formData.maxShopScore}
							class="themed-input-on-box w-full text-center"
						/>
					</label>
				</div>
			</div>

			<div class="flex flex-row gap-3">
				<div class="flex-1">
					<label class="flex flex-col gap-1">
						<span class="text-sm">Max price (brick)</span>
						<input
							type="number"
							name="maxPrice"
							min="0"
							required
							bind:value={formData.maxPrice}
							class="themed-input-on-box w-full text-center"
						/>
					</label>
				</div>
				<div class="flex-1">
					<label class="flex flex-col gap-1">
						<span class="text-sm">Min price (brick)</span>
						<input
							type="number"
							name="minPrice"
							min="0"
							required
							max={formData.maxPrice}
							bind:value={formData.minPrice}
							class="themed-input-on-box w-full text-center"
						/>
					</label>
				</div>
			</div>
		</div>
	</div>

	<label class="flex flex-row items-center gap-1">
		<input type="checkbox" name="isPublic" checked={formData.isPublic} class="checkbox" />
		<span>Is public</span>
	</label>

	<div class="flex gap-2">
		<button type="submit" class="button primary md" disabled={formPending}>Save</button>
		<a href="../.." class="button dark-red md">Cancel</a>
	</div>
</form>
