<script lang="ts">
	import relativeDate from 'tiny-relative-date';
	import { Calendar, ExternalLink } from '@lucide/svelte';
	import Devlog from '$lib/components/Devlog.svelte';
	import Head from '$lib/components/Head.svelte';

	let { data } = $props();
</script>

<Head title={data.requestedUser.name} />

<div class="flex h-full w-full flex-row gap-10">
	<div class="flex w-50 min-w-50 flex-col gap-5 lg:w-65 lg:min-w-65">
		<div class="themed-box flex flex-col items-center gap-2 p-5 shadow-lg/20">
			<img
				src={data.requestedUser.profilePicture}
				alt="User profile pic"
				class="aspect-square h-30 rounded-lg border-3 border-primary-800"
			/>
			<h1 class="truncate text-2xl font-bold">{data.requestedUser.name}</h1>

			<p class="text-center">
				{#if data.requestedUser.isPrinter}
					<span class="rounded-sm bg-primary-900 px-1 text-nowrap">printer</span>
				{/if}
				{#if data.requestedUser.hasT1Review}
					<span class="rounded-sm bg-primary-800 px-1 text-nowrap">T1 review</span>
				{/if}
				{#if data.requestedUser.hasT2Review}
					<span class="rounded-sm bg-primary-700 px-1 text-nowrap">T2 review</span>
				{/if}
				{#if data.requestedUser.hasAdmin}
					<span class="rounded-sm bg-primary-600 px-1 text-nowrap">admin</span>
				{/if}
			</p>

			<p>
				Market score: <span class="rounded-xl bg-primary-800 px-1"
					>{data.requestedUser.shopScore}</span
				>
			</p>

			<Calendar />
			<div class="items-center text-center">
				<p>
					Joined <abbr title={`${data.requestedUser.createdAt.toUTCString()}`}>
						{relativeDate(data.requestedUser.createdAt)}
					</abbr>
				</p>
				{#if data.requestedUser.lastLoginAt}
					<p>
						Last login <abbr title={`${data.requestedUser.lastLoginAt.toUTCString()}`}>
							{relativeDate(data.requestedUser.lastLoginAt)}
						</abbr>
					</p>
				{/if}
			</div>
		</div>
		<div class="themed-box flex flex-col items-center gap-2 p-3 shadow-lg/20">
			<h1 class="text-xl font-semibold">Projects</h1>
			{#if data.projects.length == 0}
				<p>
					No projects yet <img
						src="https://emoji.slack-edge.com/T0266FRGM/heavysob/55bf09f6c9d93d08.png"
						alt="heavysob"
						class="inline h-5.5"
					/>
				</p>
			{:else}
				<div class="flex w-full flex-col gap-1">
					{#each data.projects as project}
						<div class="flex w-full flex-row gap-1">
							<a
								class="grow truncate rounded-l-lg bg-primary-800 p-2 text-center outline-primary-50 transition-colors hover:bg-primary-700 hover:outline-2"
								href={`/dashboard/projects/${project.id}`}
							>
								{project.name}
							</a>
							<a
								class={`rounded-r-lg bg-primary-900 p-2 text-center transition-colors ${project.url && project.url.length > 0 ? 'outline-primary-50 hover:bg-primary-800 hover:outline-2' : 'opacity-60'}`}
								href={project.url && project.url.length > 0 ? project.url : null}
								target="_blank"
							>
								<ExternalLink />
							</a>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
	<div class="w-full">
		<div class="flex w-full grow flex-col gap-3">
			<h1 class="mt-5 font-hero text-2xl font-medium">Activity</h1>
			{#if data.devlogs.length > 0}
				<div class="mb-5 flex flex-col gap-3">
					{#each data.devlogs as devlog}
						<Devlog
							{devlog}
							projectId={devlog.projectId}
							projectName={devlog.projectName}
							showModifyButtons={false}
						/>
					{/each}
				</div>
			{:else}
				<div class="flex grow items-center justify-center">
					<div class="themed-box p-3 shadow-lg/20">
						<p>Nothing yet :(</p>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
