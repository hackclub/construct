<script lang="ts">
	import Head from '$lib/components/Head.svelte';
	import DataCard from '$lib/components/DataCard.svelte';
	import { formatMinutes } from '$lib/utils.js';
	import { Building2, Users, Clock, Ship, NotebookText } from '@lucide/svelte';

	let { data } = $props();

	let clubSearch = $state('');

	let filteredClubs = $derived(
		data.clubs.filter((c) => c.name?.toLowerCase().includes(clubSearch.toLowerCase()))
	);
</script>

<Head title="Clubs" />

<div class="flex h-full flex-col">
	<h1 class="mt-5 mb-3 font-hero text-3xl font-medium">Clubs</h1>

	<div class="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
		<DataCard title="Total clubs">
			<div class="flex items-center gap-2">
				<Building2 size={18} />
				<code>{data.totalClubs}</code>
			</div>
		</DataCard>
		<DataCard title="Total members">
			<div class="flex items-center gap-2">
				<Users size={18} />
				<code>{data.totalMembers}</code>
			</div>
		</DataCard>
		<DataCard title="Total hours">
			<div class="flex items-center gap-2">
				<Clock size={18} />
				<code>{formatMinutes(data.totalMinutes)}</code>
			</div>
		</DataCard>
		<DataCard title="Shipped projects">
			<div class="flex items-center gap-2">
				<Ship size={18} />
				<code>{data.totalShips}</code>
			</div>
		</DataCard>
		<DataCard title="Devlogs">
			<div class="flex items-center gap-2">
				<NotebookText size={18} />
				<code>{data.totalDevlogs}</code>
			</div>
		</DataCard>
	</div>

	<p class="mb-3 text-lg">Showing {filteredClubs.length} clubs</p>

	<input class="themed-box mb-3 w-full p-2" placeholder="Search clubs..." bind:value={clubSearch} />

	{#if filteredClubs.length == 0}
		<div class="flex grow items-center justify-center">
			<p class="themed-box p-3 shadow-lg/20">No clubs found matching the filter</p>
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
			{#each filteredClubs as c}
				<a
					class="themed-box flex flex-col gap-2 p-3 shadow-lg/20 transition-all hover:scale-102"
					href={`/dashboard/admin/admin/clubs/${c.id}`}
				>
					<div class="flex items-center gap-2">
						<Building2 size={20} class="shrink-0" />
						<h2 class="truncate text-xl font-semibold">{c.name}</h2>
						<span class="ml-auto whitespace-nowrap rounded-sm bg-primary-700 px-1.5 py-0.5 text-xs">
							{c.shipCount} shipped
						</span>
					</div>
					<div class="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
						<p><span class="opacity-60">Members:</span> {c.memberCount}</p>
						<p><span class="opacity-60">Hours:</span> {formatMinutes(c.totalMinutes)}</p>
						<p><span class="opacity-60">Devlogs:</span> {c.devlogCount}</p>
						<p>
							<span class="opacity-60">Avg:</span> {formatMinutes(c.avgMinutesPerMember)}
							/member
						</p>
					</div>
					<div class="flex flex-wrap gap-3 text-sm">
						<p><span class="opacity-60">Leader:</span> {c.leaderName ?? '—'}</p>
						<p><span class="opacity-60">Code:</span> <code>{c.joinCode ?? '—'}</code></p>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>
