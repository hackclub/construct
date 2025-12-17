<script lang="ts">
	import DataCard from '$lib/components/DataCard.svelte';
	import Head from '$lib/components/Head.svelte';
	import { formatMinutes, projectStatuses } from '$lib/utils.js';
	import { CircleDollarSign, Clock, PencilRuler, User } from '@lucide/svelte';

	let { data } = $props();
</script>

<Head title="Stats" />

<div class="flex h-full flex-col">
	<h1 class="mt-5 mb-3 font-hero text-3xl font-medium">Stats</h1>

	<div class="flex flex-col gap-5">
		<div class="flex flex-col gap-1">
			<h2 class="flex flex-row gap-2 text-2xl font-bold"><User size={28} />Users</h2>
			<div
				class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
			>
				<DataCard title="Total">
					<code>{data.users.count}</code>
				</DataCard>
				<DataCard title="With projects">
					<code>{data.usersWithProjects.total}</code>
				</DataCard>
				<DataCard title="With shipped projects">
					<code>{data.usersWithProjects.shipped}</code>
				</DataCard>
			</div>
		</div>

		<div class="flex flex-col gap-1">
			<h2 class="flex flex-row gap-2 text-2xl font-bold"><PencilRuler size={28} />Projects</h2>
			<div
				class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
			>
				<DataCard title="Total">
					<code>{data.project.count}</code>
				</DataCard>
				<DataCard title="Devlog count">
					<code>{data.devlogs.count}</code>
				</DataCard>
				<DataCard title="Shipped projects">
					<code>{data.shippedProjectCount}</code>
				</DataCard>
			</div>
			<h3 class="mt-1 text-xl font-semibold">By status</h3>
			<div
				class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
			>
				<DataCard title={projectStatuses.building}>
					<code>{data.project.building}</code>
				</DataCard>
				<DataCard title={projectStatuses.submitted}>
					<code>{data.project.submitted}</code>
				</DataCard>
				<DataCard title={projectStatuses.t1_approved}>
					<code>{data.project.t1_approved}</code>
				</DataCard>
				<DataCard title={projectStatuses.printing}>
					<code>{data.project.printing}</code>
				</DataCard>
				<DataCard title={projectStatuses.printed}>
					<code>{data.project.printed}</code>
				</DataCard>
				<DataCard title={projectStatuses.finalized}>
					<code>{data.project.finalized}</code>
				</DataCard>
				<DataCard title={projectStatuses.rejected}>
					<code>{data.project.rejected}</code>
				</DataCard>
				<DataCard title={projectStatuses.rejected_locked}>
					<code>{data.project.rejected_locked}</code>
				</DataCard>
			</div>
		</div>

		<div class="flex flex-col gap-1">
			<h2 class="flex flex-row gap-2 text-2xl font-bold"><Clock size={28} />Time</h2>
			<div
				class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
			>
				<DataCard title="Total">
					{formatMinutes(data.devlogs.totalTime)}
				</DataCard>
				<DataCard title="Average devlog time">
					{formatMinutes(data.devlogs.timePerDevlog)}
				</DataCard>
			</div>
		</div>

		<div class="flex flex-col gap-1">
			<h2 class="flex flex-row gap-2 text-2xl font-bold"><CircleDollarSign size={28} />Currency</h2>
			<h3 class="text-xl font-semibold">Total</h3>
			<div
				class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
			>
				<DataCard title="Clay">
					<code>{data.users.total.clay}</code>
				</DataCard>
				<DataCard title="Bricks">
					<code>{data.users.total.brick}</code>
				</DataCard>
				<DataCard title="Market score">
					<code>{data.users.total.shopScore}</code>
				</DataCard>
			</div>
			<h3 class="mt-1 text-xl font-semibold">Average</h3>
			<div
				class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
			>
				<DataCard title="Clay">
					<code>{Math.round(data.users.average.clay * 100) / 100}</code>
				</DataCard>
				<DataCard title="Bricks">
					<code>{Math.round(data.users.average.brick * 100) / 100}</code>
				</DataCard>
				<DataCard title="Market score">
					<code>{Math.round(data.users.average.shopScore * 100) / 100}</code>
				</DataCard>
			</div>
		</div>
	</div>
</div>
