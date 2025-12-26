<script lang="ts">
	import { enhance } from '$app/forms';
	import Head from '$lib/components/Head.svelte';

	let { data, form } = $props();

	let userSearch = $state('');

	let filteredUsers = $derived(
		data.users.filter((user) => user.name?.toLowerCase().includes(userSearch.toLowerCase()))
	);

	let logoutEveryonePending = $state(false);
</script>

<Head title="Users" />

<div class="flex h-full flex-col">
	<div class="mt-5 flex flex-row">
		<h1 class="mb-3 grow font-hero text-3xl font-medium">Users</h1>
		<form
			method="POST"
			class=""
			action="?/logoutEveryone"
			use:enhance={() => {
				if (!confirm('really really log everyone out?')) {
					return async () => {};
				}
				logoutEveryonePending = true;
				return async ({ update }) => {
					await update({ reset: false });
					logoutEveryonePending = false;
				};
			}}
		>
			<button type="submit" class="button md red w-full" disabled={logoutEveryonePending}>
				nuke all sessions
			</button>
		</form>
	</div>

	<p class="mb-3 text-lg">Showing {filteredUsers.length} users</p>

	<input class="themed-box mb-3 w-full p-2" placeholder="Search users..." bind:value={userSearch} />

	{#if filteredUsers.length == 0}
		<div class="flex grow items-center justify-center">
			<div>
				<p class="themed-box p-3 shadow-lg/20">
					No users found matching the filter <img
						src="https://emoji.slack-edge.com/T0266FRGM/heavysob/55bf09f6c9d93d08.png"
						alt="heavysob"
						class="inline h-5.5"
					/>
				</p>
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
						href={`/dashboard/admin/admin/users/${user.id}`}
						aria-label="user"
					>
					</a>
					<h1 class="flex flex-row gap-1 text-xl font-semibold">
						<span class="grow truncate">{user.name}</span>
					</h1>
					<p>
						{#if user.isPrinter}
							<span class="rounded-sm bg-primary-900 px-1 text-nowrap">printer</span>
						{/if}
						{#if user.hasT1Review}
							<span class="rounded-sm bg-primary-800 px-1 text-nowrap">t1 review</span>
						{/if}
						{#if user.hasT2Review}
							<span class="rounded-sm bg-primary-700 px-1 text-nowrap">t2 review</span>
						{/if}
						{#if user.hasAdmin}
							<span class="rounded-sm bg-primary-600 px-1 text-nowrap">admin</span>
						{/if}
					</p>
					<code>
						{user.slackId}
					</code>
					<p>Hackatime: {user.hackatimeTrust}</p>
					<p>Trust: {user.trust}</p>
					<p>{user.clay} clay, {user.brick} brick, {user.shopScore} market</p>
				</div>
			{/each}
		</div>
	{/if}
</div>
