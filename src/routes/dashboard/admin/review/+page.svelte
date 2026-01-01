<script lang="ts">
	import { enhance } from '$app/forms';
	import Head from '$lib/components/Head.svelte';
	import { projectStatuses } from '$lib/utils.js';
	import { ExternalLink } from '@lucide/svelte';
	import relativeDate from 'tiny-relative-date';

	let { data, form } = $props();

	let projectSearch = $state('');
	let userSearch = $state('');

	let projects = $derived(form?.projects ?? data.projects);

	let filteredProjects = $derived(
		data.allProjects.filter((project) =>
			project.name?.toLowerCase().includes(projectSearch.toLowerCase())
		)
	);
	let filteredUsers = $derived(
		data.users.filter((user) => user.name.toLowerCase().includes(userSearch.toLowerCase()))
	);

	let formPending = $state(false);
</script>

<Head title="Review" />

<div class="flex h-full flex-col">
	<h1 class="mt-5 mb-3 font-hero text-3xl font-medium">Review</h1>

	<div class="flex flex-col-reverse gap-5 lg:flex-row">
		<div class="themed-box grow p-3">
			<h2 class="mb-2 text-xl font-bold">Filter & Sort</h2>
			<form
				method="POST"
				use:enhance={() => {
					formPending = true;
					return async ({ update }) => {
						await update();
						formPending = false;
					};
				}}
			>
				<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
					<!-- Project status -->
					<label class="flex flex-col gap-1">
						<span class="font-medium">Status</span>
						<select
							class="h-40 grow border-3 border-primary-700 bg-primary-900 fill-primary-50 p-2 text-sm ring-primary-900 placeholder:text-primary-900 active:ring-3"
							name="status"
							value={form?.fields.status ?? ['submitted']}
							multiple
						>
							{#each Object.entries(projectStatuses) as [status, longStatus]}
								<option value={status} class="truncate">{longStatus}</option>
							{/each}
						</select>
					</label>

					<!-- Project -->
					<label class="flex flex-col">
						<span class="mb-1 font-medium">Project</span>
						<div class="flex h-40 flex-col">
							<input
								type="text"
								placeholder="search"
								bind:value={projectSearch}
								class="themed-input-light border-b-0 py-1.5"
							/>
							<select
								class="themed-input-light grow"
								name="project"
								value={form?.fields.project ?? []}
								multiple
							>
								{#each filteredProjects as project}
									<option value={project.id} class="truncate">{project.name}</option>
								{/each}
							</select>
						</div>
					</label>

					<!-- User -->
					<label class="flex flex-col">
						<span class="mb-1 font-medium">User</span>
						<div class="flex h-40 flex-col">
							<input
								type="text"
								placeholder="search"
								bind:value={userSearch}
								class="themed-input-light border-b-0 py-1.5"
							/>
							<select
								class="themed-input-light grow"
								name="user"
								value={form?.fields.user ?? []}
								multiple
							>
								{#each filteredUsers as user}
									<option value={user?.id} class="truncate">{user?.name}</option>
								{/each}
							</select>
						</div>
					</label>
				</div>
				<button type="submit" class="button md primary mt-3 w-full" disabled={formPending}
					>Apply!</button
				>
			</form>
		</div>
		<div class="themed-box grow p-3 lg:min-w-[30%]">
			<h2 class="text-xl font-bold">Leaderboard</h2>
			<div class="w-full overflow-x-auto">
				{#if data.leaderboard?.length > 0}
					<table class="w-full text-sm">
						<thead>
							<tr class="text-primary-300">
								<th class="py-1" align="left">Reviewer</th>
								<th class="py-1" align="right">Reviews</th>
							</tr>
						</thead>
						<tbody>
							{#each data.leaderboard as row}
								<tr>
									<td class="py-1" align="left">
										<a class="underline" href={`/dashboard/users/${row.id}`}>{row.name}</a>
									</td>
									<td class="py-1" align="right">{row.review_count}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				{:else}
					<p class="text-sm text-primary-300">No reviews yet.</p>
				{/if}
			</div>
		</div>
	</div>

	<h2 class="mt-4 mb-2 text-2xl font-bold">Projects <span class="ml-2 align-middle text-sm font-normal">({projects.length})</span></h2>

	{#if projects.length == 0}
		<div class="flex grow items-center justify-center">
			<div>
				<p class="themed-box p-3 shadow-lg/20">
					No projects found matching the filter <img
						src="https://emoji.slack-edge.com/T0266FRGM/heavysob/55bf09f6c9d93d08.png"
						alt="heavysob"
						class="inline h-5.5"
					/>
				</p>
			</div>
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
			{#each projects as project}
				<div
					class="themed-box relative flex flex-col p-3 shadow-lg/20 transition-all hover:scale-102"
				>
					<a
						class="absolute inset-0 z-1"
						href={`/dashboard/admin/review/${project.project.id}`}
						aria-label="project"
					>
					</a>
					<h1 class="flex flex-row gap-1 text-xl font-semibold">
						<span class="grow truncate">{project.project.name}</span>
					</h1>
					<p class="text-sm">
						by <a class="relative z-2 underline" href={`/dashboard/users/${project.user?.id}`}
							>{project.user?.name}</a
						>
					</p>
					<p class="grow">{project.project.description}</p>
					{#if project.project.url && project.project.url.length > 0}
						<div class="my-2 flex">
							<a class="button sm primary relative z-2" href={project.project.url} target="_blank">
								<ExternalLink />
								Printables page
							</a>
						</div>
					{:else}
						<div class="mb-2"></div>
					{/if}
					<p class="text-sm">
						{project.devlogCount} journal{project.devlogCount !== 1 ? 's' : ''} ∙ {Math.floor(
							project.timeSpent / 60
						)}h {project.timeSpent % 60}min
					</p>
					<div class="flex flex-row gap-4">
						<p class="grow text-sm">
							Created <abbr
								title={`${project.project.createdAt.toUTCString()}`}
								class="relative z-2"
							>
								{relativeDate(project.project.createdAt)}
							</abbr>
						</p>
						<p class="text-sm">{projectStatuses[project.project.status]}</p>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
