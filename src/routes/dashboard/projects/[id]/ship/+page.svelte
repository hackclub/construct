<script lang="ts">
	import { enhance } from '$app/forms';
	import Head from '$lib/components/Head.svelte';
	import Project from '$lib/components/Project.svelte';
	import type { PageProps } from './$types';
	import { Ship } from '@lucide/svelte';

	let { data }: PageProps = $props();

	let formPending = $state(false);
</script>

<Head title="Ship project" />

<h1 class="mt-5 mb-3 font-hero text-2xl font-medium">Ship project</h1>
<Project
	id={data.project.id}
	name={data.project.name}
	description={data.project.description}
	url={data.project.url}
	timeSpent={data.project.timeSpent}
	createdAt={data.project.createdAt}
	status={data.project.status}
	clickable={false}
/>
<p class="mt-3">
	{#if data.project.timeSpent < 120}
		You need at least 2h to ship
	{:else if data.project.description == '' || data.project.url == ''}
		Project must have a description and Printables URL to ship
	{:else}
		Are you sure you want to ship "{data.project.name}"? You won't be able to edit it or journal
		again unless it gets rejected.
	{/if}
</p>
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
	<button
		class="button sm orange"
		disabled={formPending ||
			data.project.timeSpent < 120 ||
			data.project.url == '' ||
			data.project.description == ''}
	>
		<Ship />
		Ship
	</button>
</form>
