<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Head from '$lib/components/Head.svelte';
	import Project from '$lib/components/Project.svelte';

	let { data } = $props();
</script>

<Head title="Projects" />

<div class="flex h-full flex-col">
	<div class="flex justify-between items-center">
		<div>
			<h1 class="mt-5 mb-2 font-hero text-3xl font-medium">Projects</h1>
			<h2 class="text-lg text-[#72685e] font-medium">{data.totalHours}h total ∙ {data.finalHours}h finalized</h2>
		</div>
		<Button
			text="Create project"
			bgcolor="bg-primary-800"
			bgcolor_hover="bg-primary-700"
			href="/dashboard/projects/create"
			class="-mt-14"
		/>
	</div>
	{#if data.projects.length == 0}
		<div class="flex grow items-center justify-center">
			<div>
				<p class="themed-box p-3 shadow-lg/20">
					No projects yet <img
						src="https://emoji.slack-edge.com/T0266FRGM/heavysob/55bf09f6c9d93d08.png"
						alt="heavysob"
						class="inline h-5.5"
					/>
				</p>
			</div>
		</div>
	{:else}
		<div class="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-5 mt-2">
			{#each data.projects as project}
				<Project
					id={project.id}
					name={project.name}
					description={project.description}
					url={project.url}
					editorFileType={project.editorFileType}
					editorUrl={project.editorUrl}
					uploadedFileUrl={project.uploadedFileUrl}
					createdAt={project.createdAt}
					timeSpent={project.timeSpent}
					status={project.status}
					clickable={true}
				/>
			{/each}
		</div>
	{/if}
</div>
