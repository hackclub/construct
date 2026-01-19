<script lang="ts">
	import { enhance } from '$app/forms';
	import Head from '$lib/components/Head.svelte';
	import relativeDate from 'tiny-relative-date';

	let { data, form } = $props();

	let marketItemSearch = $state('');
	let userSearch = $state('');

	let orders = $derived(form?.orders ?? data.orders);

	const marketOrderStatuses = {
		awaiting_approval: 'Pending',
		fulfilled: 'Fulfilled',
		denied: 'Denied',
		refunded: 'Refunded'
	};

	let filteredMarketItems = $derived(
		data.allMarketItems.filter((item) =>
			item.name?.toLowerCase().includes(marketItemSearch.toLowerCase())
		)
	);
	let filteredUsers = $derived(
		data.users.filter((user) => user.name.toLowerCase().includes(userSearch.toLowerCase()))
	);

	let formPending = $state(false);
</script>

<Head title="Market orders" />

<div class="mb-5 flex flex-col">
	<h1 class="mt-5 mb-3 font-hero text-3xl font-medium">Market item orders</h1>

	<div class="flex flex-col-reverse gap-5 lg:flex-row">
		<div class="themed-box grow p-3">
			<h2 class="mb-2 text-xl font-bold">Filter & Sort</h2>
			<form
				method="POST"
				use:enhance={() => {
					formPending = true;
					return async ({ update }) => {
						await update();
						formPending = false;
					};
				}}
			>
				<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
					<!-- Status -->
					<label class="flex flex-col gap-1">
						<span class="font-medium">Status</span>
						<select
							class="h-40 grow border-3 border-primary-700 bg-primary-900 fill-primary-50 p-2 text-sm ring-primary-900 placeholder:text-primary-900 active:ring-3"
							name="status"
							value={form?.fields.status ?? ['awaiting_approval']}
							multiple
						>
							{#each Object.entries(marketOrderStatuses) as [status, longStatus] (status)}
								<option value={status} class="truncate">{longStatus}</option>
							{/each}
						</select>
					</label>

					<!-- Market item -->
					<label class="flex flex-col">
						<span class="mb-1 font-medium">Market item</span>
						<div class="flex h-40 flex-col">
							<input
								type="text"
								placeholder="search"
								bind:value={marketItemSearch}
								class="themed-input-light border-b-0 py-1.5"
							/>
							<select
								class="themed-input-light grow"
								name="marketItem"
								value={form?.fields.marketItem ?? []}
								multiple
							>
								{#each filteredMarketItems as item (item.id)}
									<option value={item.id} class="truncate">{item.name}</option>
								{/each}
							</select>
						</div>
					</label>

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
								value={form?.fields.user ?? []}
								multiple
							>
								{#each filteredUsers as user (user?.id)}
									<option value={user?.id} class="truncate">{user?.name}</option>
								{/each}
							</select>
						</div>
					</label>
				</div>
				<button type="submit" class="button md primary mt-3 w-full" disabled={formPending}
					>Apply!</button
				>
			</form>
		</div>
	</div>

	<h2 class="mt-4 mb-2 text-2xl font-bold">
		Orders <span class="ml-2 align-middle text-sm font-normal">({orders.length})</span>
	</h2>

	{#if orders.length == 0}
		<div class="flex grow items-center justify-center">
			<div>
				<p class="themed-box p-3 shadow-lg/20">
					No orders found matching the filter <img
						src="https://emoji.slack-edge.com/T0266FRGM/heavysob/55bf09f6c9d93d08.png"
						alt="heavysob"
						class="inline h-5.5"
					/>
				</p>
			</div>
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
			{#each orders as order (order.order.id)}
				<div
					class="themed-box relative flex flex-col p-3 shadow-lg/20 transition-all hover:scale-102"
				>
					<a
						class="absolute inset-0 z-1"
						href={`/dashboard/admin/admin/orders/${order.order.id}`}
						aria-label="order"
					>
					</a>
					{#if order.marketItem?.image}
						<img
							src={order.marketItem.image}
							alt={order.marketItem?.name || 'Market item'}
							class="mb-2 aspect-[5/3] w-full overflow-hidden rounded-lg bg-primary-800/10 object-contain"
						/>
					{/if}
					<h1 class="flex flex-row gap-1 text-xl font-semibold">
						<span class="grow truncate">{order.marketItem?.name || 'Unknown item'}</span>
					</h1>
					<p class="text-sm">
						by <a class="relative z-2 underline" href={`/dashboard/users/${order.user?.id}`}
							>{order.user?.name}</a
						>
					</p>
					<p class="mt-1 text-sm">
						Bricks paid: {order.order.bricksPaid}
					</p>
					<div class="flex flex-row gap-4">
						<p class="grow text-sm">
							Ordered <abbr title={`${order.order.createdAt.toUTCString()}`} class="relative z-2">
								{relativeDate(order.order.createdAt)}
							</abbr>
						</p>
						<p class="text-sm">{marketOrderStatuses[order.order.status]}</p>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
