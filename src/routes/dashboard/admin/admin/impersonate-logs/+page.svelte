<script lang="ts">
	import Head from '$lib/components/Head.svelte';
	import relativeDate from 'tiny-relative-date';

	let { data } = $props();
</script>

<Head title="Impersonate Audit Logs" />

<div class="flex h-full flex-col">
	<h1 class="mt-5 mb-3 font-hero text-3xl font-medium">Impersonate Audit Logs</h1>

	<p class="mb-3 text-lg">Showing {data.logs.length} impersonation events</p>

	{#if data.logs.length == 0}
		<div class="flex grow items-center justify-center">
			<div>
				<p class="themed-box p-3 shadow-lg/20">
					No impersonation events found <img
						src="https://emoji.slack-edge.com/T0266FRGM/heavysob/55bf09f6c9d93d08.png"
						alt="heavysob"
						class="inline h-5.5"
					/>
				</p>
			</div>
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
			{#each data.logs as log (log.id)}
				<div class="themed-box flex flex-col gap-3 p-3 shadow-lg/20">
					<div class="flex flex-row items-center gap-3">
						<img
							src={log.adminUser?.profilePicture}
							alt={log.adminUser?.name}
							class="h-12 w-12 rounded-full border-2 border-primary-800"
						/>
						<div class="grow">
							<p class="text-sm font-medium">Admin</p>
							<a
								href={`/dashboard/admin/admin/users/${log.adminUser?.id}`}
								class="text-lg font-semibold underline"
							>
								{log.adminUser?.name}
							</a>
						</div>
					</div>

					<div class="flex flex-row items-center gap-3">
						<img
							src={log.targetUser?.profilePicture}
							alt={log.targetUser?.name}
							class="h-12 w-12 rounded-full border-2 border-primary-800"
						/>
						<div class="grow">
							<p class="text-sm font-medium">Impersonated</p>
							<a
								href={`/dashboard/admin/admin/users/${log.targetUser?.id}`}
								class="text-lg font-semibold underline"
							>
								{log.targetUser?.name}
							</a>
						</div>
					</div>

					<div class="text-sm">
						<abbr title={`${log.timestamp.toUTCString()}`} class="relative z-2">
							{relativeDate(log.timestamp)}
						</abbr>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
