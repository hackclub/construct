<script lang="ts">
	import relativeDate from 'tiny-relative-date';
	import Head from '$lib/components/Head.svelte';
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	let formPending = $state(false);

	const marketOrderStatuses = {
		awaiting_approval: 'Awaiting Approval',
		fulfilled: 'Fulfilled',
		denied: 'Denied',
		refunded: 'Refunded'
	};
</script>

<Head title={'Order #' + data.orderData.order.id} />

<div class="flex flex-col gap-3 pb-5">
	<h1 class="mt-5 font-hero text-2xl font-medium">
		Order #{data.orderData.order.id}: {data.orderData.marketItem?.name}
	</h1>

	<h2 class="mt-2 text-2xl font-bold">Order details</h2>

	<div class="themed-box flex flex-row gap-3 p-3 shadow-lg">
		<div class="flex grow flex-col gap-3">
			<div>
				<p class="text-xl font-bold">{data.orderData.marketItem?.name}</p>
				<p>{data.orderData.marketItem?.description}</p>
			</div>

			<div>
				<h3 class="text-lg font-bold">User</h3>
				<p>
					<a class="underline" href={`/dashboard/users/${data.orderData.user?.id}`}>
						{data.orderData.user?.name}
					</a>
				</p>
				{#if data.orderData.user?.slackId}
					<p>
						Slack ID: <a
							class="underline"
							href={`https://hackclub.slack.com/team/${data.orderData.user.slackId}`}
							target="_blank">{data.orderData.user.slackId}</a
						>
					</p>
				{/if}
			</div>

			<div>
				<h3 class="text-lg font-bold">Payment</h3>
				<p>Bricks paid: {data.orderData.order.bricksPaid}</p>
			</div>

			<div>
				<h3 class="text-lg font-bold">Status</h3>
				<p>{marketOrderStatuses[data.orderData.order.status]}</p>
			</div>

			<div>
				<h3 class="text-lg font-bold">Shipping address</h3>
				{#if data.userDataError}
					<p class="text-red-500">Failed to fetch user data, ask them to re-login</p>
				{:else if data.address}
					<p>{data.address.line_1}</p>
					{#if data.address.line_2}
						<p>{data.address.line_2}</p>
					{/if}
					<p>
						{data.address.city}, {data.address.state},
						{data.address.postal_code}
					</p>
					<p>{data.address.country}</p>
				{:else}
					<p>Address not found</p>
				{/if}
			</div>

			<div>
				<h3 class="text-lg font-bold">User notes</h3>
				<p class="whitespace-pre-wrap">{data.orderData.order.userNotes || 'None'}</p>
			</div>

			<div>
				<h3 class="text-lg font-bold">Order date</h3>
				<p>
					Created <abbr title={`${data.orderData.order.createdAt.toUTCString()}`}>
						{relativeDate(data.orderData.order.createdAt)}
					</abbr>
				</p>
			</div>
		</div>
		<div>
			{#if data.orderData.marketItem?.image}
				<div>
					<img
						src={data.orderData.marketItem.image}
						alt={data.orderData.marketItem.name}
						class="w-80 rounded"
					/>
				</div>
			{/if}
		</div>
	</div>

	<h2 class="mt-2 text-2xl font-bold">Admin notes</h2>
	<div class="themed-box flex flex-col gap-3 p-3 shadow-lg">
		<form
			method="POST"
			action="?/updateNotes"
			class="flex flex-col gap-3"
			use:enhance={() => {
				formPending = true;
				return async ({ update }) => {
					await update({ reset: false });
					formPending = false;
				};
			}}
		>
			<label class="flex flex-col gap-1">
				<span class="font-medium"
					>Notes <span class="opacity-50">(e.g., tracking number, shown to user)</span></span
				>
				<textarea name="notes" class="themed-input-on-box" value={data.orderData.order.notes || ''}
				></textarea>
			</label>

			{#if form?.message}
				<p class={form.success ? 'text-primary-500' : 'text-red-500'}>{form.message}</p>
			{/if}

			<button type="submit" class="button md primary w-full" disabled={formPending}>
				Update notes
			</button>
		</form>
	</div>

	<h2 class="mt-2 text-2xl font-bold">Actions</h2>
	<div class="themed-box flex flex-col gap-3 p-3 shadow-lg">
		{#if data.orderData.order.status === 'awaiting_approval'}
			<form
				method="POST"
				action="?/markShipped"
				use:enhance={() => {
					formPending = true;
					return async ({ update }) => {
						await update({ reset: false });
						formPending = false;
					};
				}}
				onsubmit={() => {
					return confirm('Mark this order as shipped?');
				}}
			>
				<button type="submit" class="button md primary w-full" disabled={formPending}>
					Mark as shipped
				</button>
			</form>

			<form
				method="POST"
				action="?/refund"
				use:enhance={() => {
					formPending = true;
					return async ({ update }) => {
						await update({ reset: false });
						formPending = false;
					};
				}}
			>
				<button type="submit" class="button md orange w-full" disabled={formPending}>
					Refund order
				</button>
			</form>

			<form method="POST" action="?/deny">
				<button type="submit" class="button md dark-red w-full">Deny without refund</button>
			</form>
		{:else}
			<p class="text-center text-sm opacity-70">
				Order is {marketOrderStatuses[data.orderData.order.status].toLowerCase()}, no actions
				available
			</p>
		{/if}
	</div>
</div>
