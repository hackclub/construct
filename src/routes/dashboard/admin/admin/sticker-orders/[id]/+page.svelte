<script lang="ts">
	import Head from '$lib/components/Head.svelte';
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	let formPending = $state(false);
</script>

<Head title={'Sticker order for ' + data.userData.name} />

<div class="flex flex-col gap-3 pb-5">
	<h1 class="mt-5 font-hero text-2xl font-medium">
		Sticker order for {data.userData.name}
	</h1>

	<h2 class="mt-2 text-2xl font-bold">User details</h2>

	<div class="themed-box flex flex-row gap-3 p-3 shadow-lg">
		<div class="flex grow flex-col gap-3">
			<div class="flex flex-row items-center gap-3">
				{#if data.userData.profilePicture}
					<img
						src={data.userData.profilePicture}
						alt={data.userData.name}
						class="h-16 w-16 rounded-full bg-primary-800/10"
					/>
				{/if}
				<div>
					<p class="text-xl font-bold">{data.userData.name}</p>
					{#if data.userData.slackId}
						<p class="text-sm">
							Slack ID: <a
								class="underline"
								href={`https://hackclub.slack.com/team/${data.userData.slackId}`}
								target="_blank">{data.userData.slackId}</a
							>
						</p>
					{/if}
				</div>
			</div>

			<div>
				<h3 class="text-lg font-bold">Sticker Fulfillment Status</h3>
				<p class="capitalize">{data.userData.stickerFulfilmentStatus}</p>
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
		</div>
	</div>

	<h2 class="mt-2 text-2xl font-bold">Actions</h2>
	<div class="themed-box flex flex-col gap-3 p-3 shadow-lg">
		{#if data.userData.stickerFulfilmentStatus === 'ordered'}
			<form
				method="POST"
				action="?/markFulfilled"
				use:enhance={() => {
					formPending = true;
					return async ({ update }) => {
						await update({ reset: false });
						formPending = false;
					};
				}}
				onsubmit={() => {
					return confirm('Mark this sticker order as fulfilled?');
				}}
			>
				{#if form?.message}
					<p class={form.success ? 'text-primary-500 mb-2' : 'text-red-500 mb-2'}>{form.message}</p>
				{/if}
				<button type="submit" class="button md primary w-full" disabled={formPending}>
					Mark as fulfilled
				</button>
			</form>
		{:else}
			<p class="text-center text-sm opacity-70">
				Sticker order is {data.userData.stickerFulfilmentStatus}, no actions available
			</p>
		{/if}
	</div>
</div>
