<script lang="ts">
	import Head from '$lib/components/Head.svelte';
	import DataCard from '$lib/components/DataCard.svelte';
	import { formatMinutes } from '$lib/utils.js';
	import { ArrowLeft, Users, Clock, Ship } from '@lucide/svelte';

	let { data } = $props();
</script>

<Head title={data.club.name} />

<div class="flex h-full flex-col">
	<a
		href="/dashboard/admin/admin/clubs"
		class="link mb-3 inline-flex items-center gap-1 text-sm"
	>
		<ArrowLeft size={16} />
		Back to clubs
	</a>

	<h1 class="mb-5 font-hero text-3xl font-medium">{data.club.name}</h1>

	<div class="grid grid-cols-1 gap-3 md:grid-cols-3">
		<DataCard title="Members">
			<div class="flex items-center gap-2">
				<Users size={18} />
				<code>{data.members.length}</code>
			</div>
		</DataCard>
		<DataCard title="Total club hours">
			<div class="flex items-center gap-2">
				<Clock size={18} />
				<code>{formatMinutes(data.totalMinutes)}</code>
			</div>
		</DataCard>
		<DataCard title="Shipped projects">
			<div class="flex items-center gap-2">
				<Ship size={18} />
				<code>{data.shipCount}</code>
			</div>
		</DataCard>
	</div>

	<div class="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
		<DataCard title="Join code">
			<code>{data.club.joinCode ?? '—'}</code>
		</DataCard>
		<DataCard title="Created">
			{data.club.createdAt?.toLocaleDateString() ?? '—'}
		</DataCard>
	</div>

	<h2 class="mt-6 mb-3 flex items-center gap-2 text-2xl font-bold">
		<Users size={24} />
		Members ({data.members.length})
	</h2>

	<div class="flex flex-col gap-2">
		{#each data.members as member}
			<div class="themed-box flex items-center gap-3 p-3">
				<img
					src={member.profilePicture}
					alt={member.name}
					class="h-10 w-10 shrink-0 rounded-full"
				/>
				<div class="min-w-0 flex-1">
					<a
						href="/dashboard/admin/admin/users/{member.id}"
						class="link font-medium"
					>
						{member.name}
					</a>
					<p class="text-sm opacity-60">
						<span
							class="rounded-sm px-1 text-xs {member.role === 'leader'
								? 'bg-primary-600'
								: 'bg-primary-800'}"
						>
							{member.role === 'leader' ? 'Leader' : 'Member'}
						</span>
					</p>
				</div>
				<div class="shrink-0 text-right">
					<p class="font-medium">{formatMinutes(member.totalMinutes)}</p>
					<p class="text-xs opacity-60">{member.devlogCount} devlogs</p>
				</div>
			</div>
		{/each}
	</div>
</div>
