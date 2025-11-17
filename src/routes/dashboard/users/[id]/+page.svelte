<script lang="ts">
	import relativeDate from 'tiny-relative-date';
	import { Calendar, ExternalLink } from '@lucide/svelte';
	import Devlog from '$lib/components/Devlog.svelte';

	let { data } = $props();
</script>

<div class="flex h-full flex-row gap-10">
	<div class="flex w-50 min-w-50 flex-col gap-5 lg:w-65 lg:min-w-65">
		<div class="themed-box flex flex-col items-center gap-2 p-5 shadow-lg/20">
			<img
				src={data.requestedUser.profilePicture}
				alt="User profile pic"
				class="aspect-square h-30 border-3 border-amber-800 rounded-lg"
			/>
			<h1 class="text-2xl font-bold truncate">{data.requestedUser.name}</h1>
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
								class="grow truncate bg-amber-800 p-2 text-center outline-amber-50 transition-colors hover:bg-amber-700 hover:outline-2 rounded-l-lg"
								href={`/dashboard/projects/${project.id}`}
							>
								{project.name}
							</a>
							<a
								class={`bg-amber-900 p-2 text-center transition-colors rounded-r-lg ${project.url && project.url.length > 0 ? 'outline-amber-50 hover:bg-amber-800 hover:outline-2' : 'opacity-60'}`}
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
	<div>
		<div class="flex grow flex-col gap-3">
			<h1 class="mt-5 font-hero text-2xl font-medium">Activity</h1>
			{#if data.devlogs.length > 0}
				{#each data.devlogs as devlog}
					<Devlog
						{devlog}
						projectId={devlog.projectId}
						projectName={devlog.projectName}
						showModifyButtons={false}
					/>
				{/each}
			{:else}
				<div class="flex grow items-center justify-center">
					<div class="themed-box p-3 shadow-lg/20">
						<p>Nothing yet :(</p>
					</div>
				</div>
			{/if}
		</div>
		<!-- not sure why it doesn't want to work otherwise, it's really weird -->
		<div class="invisible text-xs">hello :)</div>
	</div>
</div>
