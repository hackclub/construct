<script lang="ts">
	import ChecklistItem from './ChecklistItem.svelte';

	let { data } = $props();
</script>

<h1 class="mt-5 mb-1 font-hero text-3xl font-medium">Dashboard</h1>
<p class="mb-2">Welcome to Construct!</p>
<div class="themed-box flex flex-col gap-0.5 p-3">
	<h2 class="text-xl font-bold">Checklist</h2>
	<div class="flex flex-col gap-0.5">
		<ChecklistItem completed={data.projectCount > 0}><a href="/dashboard/projects/create" class="underline">Create</a> your first project</ChecklistItem>
		<ChecklistItem completed={data.devlogCount > 0}>Create your first devlog</ChecklistItem>
		<ChecklistItem completed={data.shipCount > 0}>Ship your project</ChecklistItem>
	</div>
</div>
