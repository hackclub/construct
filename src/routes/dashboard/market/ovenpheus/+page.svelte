<script lang="ts">
	import { enhance } from '$app/forms';
	import Head from '$lib/components/Head.svelte';
	import {
		BASE_PRINTER_CLAY,
		BRICKS_PER_HOUR,
		BRICKS_PER_HOUR_CONVERTED,
		CLAY_PER_HOUR
	} from '$lib/defs';
	import ovenpheus from '$lib/assets/ovenpheus.png';

	let { data } = $props();

	let formPending = $state(false);
	let clay = $state(0);
	let bricks = $derived(
		Math.floor(
			(clay / CLAY_PER_HOUR) *
				(data.user.hasBasePrinter ? BRICKS_PER_HOUR : BRICKS_PER_HOUR_CONVERTED)
		)
	);
</script>

<Head title="Fire clay" />

<h1 class="mt-5 mb-3 font-hero text-3xl font-medium">Ovenpheus</h1>

<div class="mb-5 flex flex-row gap-5">
	<div class="w-100">
		<img src={ovenpheus} alt="ovenpheus" class="rounded-lg border-20 border-white" />
	</div>

	<div class="themed-box flex grow flex-col p-3">
		<h1 class="text-2xl font-bold">Do you want to fire {clay} clay into {bricks} bricks?</h1>
		<p class="mb-2">
			{#if !data.user.hasBasePrinter}
				Keep in mind that you'll need {BASE_PRINTER_CLAY} <em>clay</em> to get a base printer
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
				Clay to convert
				<div class="flex gap-5">
					<div>
						<input
							name="clay"
							type="number"
							bind:value={clay}
							step="1"
							min="0"
							max={Math.floor(data.user.clay)}
							class="themed-input-on-box"
						/>
					</div>
					<input
						name="clay"
						type="range"
						class="grow accent-primary-500"
						bind:value={clay}
						step="1"
						min="0"
						max={Math.floor(data.user.clay)}
					/>
				</div>
				<p class="mt-1 text-sm opacity-50">You'll get {bricks} bricks</p>
			</label>

			<div class="grow"></div>

			<button type="submit" class="button md primary" disabled={clay === 0}>
				🔥 Fire {clay} clay 🔥
			</button>
		</form>
	</div>
</div>
