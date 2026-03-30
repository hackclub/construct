<script lang="ts">
	import Head from '$lib/components/Head.svelte';
	import { navigating } from '$app/state';

	let { data } = $props();

	let userSearch = $state('');

	let filteredUsers = $derived(
		data.users.filter((user) => user.name.toLowerCase().includes(userSearch.toLowerCase()))
	);

	const fulfilmentStatusLabels: Record<string, string> = {
		none: 'None',
		queued: 'Queued',
		approved: 'Approved',
		fulfilled: 'Fulfilled'
	};

	let formPending = $derived(navigating.to !== null);
</script>

<Head title="Printer fulfilment" />

<div class="mb-5 flex flex-col">
	<h1 class="mt-5 mb-3 font-hero text-3xl font-medium">Printer fulfilment</h1>

	<div class="flex flex-col-reverse gap-5 lg:flex-row">
		<div class="themed-box grow p-3">
			<h2 class="mb-2 text-xl font-bold">Filter</h2>
			<form method="GET">
				<label class="flex flex-col gap-1">
					<span class="font-medium">Status</span>
					<select
						class="h-40 grow border-3 border-primary-700 bg-primary-900 fill-primary-50 p-2 text-sm ring-primary-900 placeholder:text-primary-900 active:ring-3"
						name="status"
						value={data.fields.status}
						multiple
					>
						{#each data.fulfilmentStatuses as status (status)}
							<option value={status} class="truncate">{fulfilmentStatusLabels[status]}</option>
						{/each}
					</select>
				</label>
				<button type="submit" class="button md primary mt-3 w-full" disabled={formPending}
					>Apply!</button
				>
			</form>
		</div>
	</div>

	<h2 class="mt-4 mb-2 text-2xl font-bold">
		Users <span class="ml-2 align-middle text-sm font-normal">({filteredUsers.length})</span>
	</h2>

	<input class="themed-box mb-3 w-full p-2" placeholder="Search users..." bind:value={userSearch} />

	{#if filteredUsers.length == 0}
		<div class="flex grow items-center justify-center">
			<div>
				<p class="themed-box p-3 shadow-lg/20">No users found matching the filter</p>
			</div>
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
			{#each filteredUsers as user}
				<div
					class="themed-box relative flex flex-col p-3 shadow-lg/20 transition-all hover:scale-102"
				>
					<a
						class="absolute inset-0 z-1"
						href={`printer-fulfilment/${user.id}`}
						aria-label="user"
					></a>
					<h1 class="flex flex-row gap-1 text-xl font-semibold">
						<span class="grow truncate">{user.name}</span>
						<span
							class="rounded-sm bg-primary-800 px-1 text-sm font-normal"
							>{fulfilmentStatusLabels[user.printerFulfilment]}</span
						>
					</h1>
					<code>{user.slackId}</code>
				</div>
			{/each}
		</div>
	{/if}
</div>
