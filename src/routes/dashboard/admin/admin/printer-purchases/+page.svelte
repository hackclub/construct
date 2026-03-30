<script lang="ts">
	import Head from '$lib/components/Head.svelte';
	import { getPrinterFromPath } from '$lib/printers.js';
	import relativeDate from 'tiny-relative-date';
	import { navigating } from '$app/state';

	let { data } = $props();

	let userSearch = $state('');

	let orders = $derived(data.orders);

	let filteredUsers = $derived(
		data.users.filter((user) => user.name.toLowerCase().includes(userSearch.toLowerCase()))
	);

	let formPending = $derived(navigating.to !== null);
</script>

<Head title="Printer purchases" />

<div class="mb-5 flex flex-col">
	<h1 class="mt-5 mb-3 font-hero text-3xl font-medium">Printer purchases</h1>

	<div class="flex flex-col-reverse gap-5 lg:flex-row">
		<div class="themed-box grow p-3">
			<h2 class="mb-2 text-xl font-bold">Filter & Sort</h2>
			<form method="GET">
					<!-- User -->
				<label class="flex flex-col">
					<span class="mb-1 font-medium">User</span>
					<div class="flex h-40 flex-col">
						<input
							type="text"
							placeholder="search"
							bind:value={userSearch}
							class="themed-input-light border-b-0 py-1.5"
						/>
						<select
							class="themed-input-light grow"
							name="user"
							value={data.fields.user}
							multiple
						>
							{#each filteredUsers as user (user?.id)}
								<option value={user?.id} class="truncate">{user?.name}</option>
							{/each}
						</select>
					</div>
				</label>
				<button type="submit" class="button md primary mt-3 w-full" disabled={formPending}
					>Apply!</button
				>
			</form>
		</div>
	</div>

	<h2 class="mt-4 mb-2 text-2xl font-bold">
		Purchases <span class="ml-2 align-middle text-sm font-normal">({orders.length})</span>
	</h2>

	{#if orders.length == 0}
		<div class="flex grow items-center justify-center">
			<div>
				<p class="themed-box p-3 shadow-lg/20">No purchases found matching the filter</p>
			</div>
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
			{#each orders as order (order.order.id)}
				{@const printer = getPrinterFromPath(order.order.printer.path)}
				<div class="themed-box flex flex-col gap-1 p-3 shadow-lg/20">
					<h1 class="text-xl font-semibold">{printer?.longName ?? 'Unknown printer'}</h1>
					<p class="text-sm">
						by <a class="underline" href={`/dashboard/users/${order.user?.id}`}
							>{order.user?.name}</a
						>
					</p>
					{#if order.order.bricksPaid != null}
						<p class="text-sm">Bricks paid: {order.order.bricksPaid}</p>
					{/if}
					{#if order.order.clayPaid != null}
						<p class="text-sm">Clay paid: {order.order.clayPaid}</p>
					{/if}
					<p class="text-sm text-primary-400">
						<abbr title={`${order.order.timestamp.toUTCString()}`}>
							{relativeDate(order.order.timestamp)}
						</abbr>
					</p>
				</div>
			{/each}
		</div>
	{/if}
</div>
