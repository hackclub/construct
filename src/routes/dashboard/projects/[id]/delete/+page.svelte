<script lang="ts">
	import { enhance } from '$app/forms';
	import Head from '$lib/components/Head.svelte';
	import Project from '$lib/components/Project.svelte';
	import type { PageProps } from './$types';
	import { Trash } from '@lucide/svelte';

	let { data }: PageProps = $props();

	let formPending = $state(false);
</script>

<Head title="Delete project" />

<h1 class="mt-5 mb-3 font-hero text-2xl font-medium">Delete project</h1>
<Project
	id={data.project.id}
	name={data.project.name}
	description={data.project.description}
	url={data.project.url}
	editorFileType={data.project.editorFileType}
	editorUrl={data.project.editorUrl}
	uploadedFileUrl={data.project.uploadedFileUrl}
	timeSpent={data.project.timeSpent}
	createdAt={data.project.createdAt}
	status={data.project.status}
	clickable={false}
/>
<p class="mt-3">Are you sure you want to delete "{data.project.name}"? This is permanent.</p>
<form
	method="POST"
	class="mt-2 flex flex-row gap-2"
	use:enhance={() => {
		formPending = true;
		return async ({ update }) => {
			await update();
			formPending = false;
		};
	}}
>
	<a href={`/dashboard/projects/${data.project.id}`} class="button sm primary">Cancel</a>
	<button class="button sm dark-red" disabled={formPending}>
		<Trash size={20} />
		Delete
	</button>
</form>
