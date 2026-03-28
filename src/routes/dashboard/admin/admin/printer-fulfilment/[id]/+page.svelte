<script lang="ts">
	import { enhance } from '$app/forms';
	import Head from '$lib/components/Head.svelte';
	import DataCard from '$lib/components/DataCard.svelte';
	import { getPrinterFromPath } from '$lib/printers.js';

	let { data } = $props();

	let user = $derived(data.queriedUser);

	const fulfilmentStatusLabels: Record<string, string> = {
		none: 'None',
		queued: 'Queued',
		approved: 'Approved',
		fulfilled: 'Fulfilled'
	};

	let formPending = $state(false);
</script>

<Head title={'Printer fulfilment: ' + user.name} />

<div class="flex h-full flex-row gap-10">
	<div class="grow">
		<div class="flex grow flex-col gap-3">
			<h1 class="mt-5 font-hero text-2xl font-medium">{user.name}</h1>

			<div>
				<img
					src={user.profilePicture}
					alt="user profile"
					class="aspect-square h-45 rounded-xl border-4 border-primary-800 shadow-lg"
				/>
			</div>

			<div class="flex flex-row flex-wrap gap-3">
				<a href={`/dashboard/users/${user.id}`} class="button md primary">Public profile</a>
				<a href={`../users/${user.id}`} class="button md primary">Admin profile</a>
			</div>

			<h2 class="mt-2 text-2xl font-bold">User details</h2>

			<div
				class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
			>
				<DataCard title="Slack ID">
					<code
						><a
							class="underline"
							href={`https://hackclub.slack.com/team/${user.slackId}`}
							target="_blank">{user.slackId}</a
						></code
					>
				</DataCard>
				<DataCard title="Printer fulfilment">
					{fulfilmentStatusLabels[user.printerFulfilment]}
				</DataCard>
				<DataCard title="Has base printer">
					{user.hasBasePrinter ? 'Yes' : 'No'}
				</DataCard>
			</div>

			<h2 class="mt-2 text-2xl font-bold">Printer orders</h2>

			{#if data.orders.length === 0}
				<p class="text-primary-400">No printer orders</p>
			{:else}
				<div class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
					{#each data.orders as order (order.id)}
						{@const printer = getPrinterFromPath(order.printer.path)}
						<div class="themed-box flex flex-col gap-1 p-3 shadow-lg/20">
							<h3 class="font-semibold">{printer?.longName ?? 'Unknown printer'}</h3>
							<p class="text-sm text-primary-400">
								{printer?.isBasePrinter ? 'Base printer' : 'Upgrade'}
							</p>
							{#if order.bricksPaid != null}
								<p class="text-sm">Bricks: {order.bricksPaid}</p>
							{/if}
							{#if order.clayPaid != null}
								<p class="text-sm">Clay: {order.clayPaid}</p>
							{/if}
						</div>
					{/each}
				</div>
			{/if}

			<h2 class="mt-2 text-2xl font-bold">Fulfilment details</h2>

			{#if data.pii}
				<div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
					<DataCard title="Email">
						{data.pii.primary_email}
					</DataCard>
					<DataCard title="Phone number">
						<code>{data.pii.phone_number}</code>
					</DataCard>
				</div>

				<h3 class="mt-3 mb-2 text-xl font-bold">Address</h3>

				<div class="themed-box p-3">
					{#if data.pii.address}
						<p>{data.pii.address.first_name} {data.pii.address.last_name}</p>
						<p>{data.pii.address.line_1}</p>
						{#if data.pii.address.line_2}
							<p>{data.pii.address.line_2}</p>
						{/if}
						<p>
							{data.pii.address.city}, {data.pii.address.state}
							{data.pii.address.postal_code}
						</p>
						<p>{data.pii.address.country}</p>
					{:else}
						<p>No address defined</p>
					{/if}
				</div>
			{:else}
				<p>Failed to fetch PII, ask them to re-login</p>
			{/if}

			<h2 class="mt-2 text-2xl font-bold">Set fulfilment status</h2>

			<div class="themed-box mb-5 p-3">
				<form
					action="?/setStatus"
					method="POST"
					use:enhance={() => {
						formPending = true;
						return async ({ update }) => {
							await update();
							formPending = false;
						};
					}}
					class="flex flex-col gap-3"
				>
					<select
						name="status"
						class="themed-input"
						value={user.printerFulfilment}
					>
						{#each data.fulfilmentStatuses as status (status)}
							<option value={status}>{fulfilmentStatusLabels[status]}</option>
						{/each}
					</select>
					<button type="submit" class="button md primary" disabled={formPending}>
						Update status
					</button>
				</form>
			</div>
		</div>
	</div>
</div>
