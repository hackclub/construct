<script lang="ts">
	import Head from '$lib/components/Head.svelte';

	let { data } = $props();

	let orderedUsers = $derived(data.orderedUsers);
</script>

<Head title="Sticker orders" />

<div class="mb-5 flex flex-col">
	<h1 class="mt-5 mb-3 font-hero text-3xl font-medium">Sticker orders</h1>

	<h2 class="mt-4 mb-2 text-2xl font-bold">
		Users with ordered stickers <span class="ml-2 align-middle text-sm font-normal"
			>({orderedUsers.length})</span
		>
	</h2>

	{#if orderedUsers.length == 0}
		<div class="flex grow items-center justify-center">
			<div>
				<p class="themed-box p-3 shadow-lg/20">
					No sticker orders found <img
						src="https://emoji.slack-edge.com/T0266FRGM/heavysob/55bf09f6c9d93d08.png"
						alt="heavysob"
						class="inline h-5.5"
					/>
				</p>
			</div>
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
			{#each orderedUsers as user (user.id)}
				<div
					class="themed-box relative flex flex-col p-3 shadow-lg/20 transition-all hover:scale-102"
				>
					<a
						class="absolute inset-0 z-1"
						href={`/dashboard/admin/admin/sticker-orders/${user.id}`}
						aria-label="sticker order"
					>
					</a>
					<div class="mb-2 flex flex-row items-center gap-3">
						{#if user.profilePicture}
							<img
								src={user.profilePicture}
								alt={user.name}
								class="h-12 w-12 rounded-full bg-primary-800/10"
							/>
						{/if}
						<div class="grow">
							<h1 class="text-xl font-semibold">
								{user.name}
							</h1>
							{#if user.slackId}
								<p class="text-sm opacity-70">
									<a
										class="relative z-2 underline"
										href={`https://hackclub.slack.com/team/${user.slackId}`}
										target="_blank">Slack</a
									>
								</p>
							{/if}
						</div>
					</div>
					<p class="text-sm">
						Status: <span class="font-medium capitalize">{user.stickerFulfilmentStatus}</span>
					</p>
				</div>
			{/each}
		</div>
	{/if}
</div>
