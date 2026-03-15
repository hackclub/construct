<script lang="ts">
	import Head from '$lib/components/Head.svelte';
	import ChecklistItem from '$lib/components/ChecklistItem.svelte';
	import { onMount } from 'svelte';

	let { data } = $props();

	let enableModelRendering = $state(true);

	onMount(() => {
		enableModelRendering = window.localStorage.getItem('enableModelRendering') !== 'false';
	});

	$effect(() => {
		window.localStorage.setItem('enableModelRendering', enableModelRendering.toString());
	});
</script>

<Head title="Dashboard" />

<h1 class="mt-5 mb-1 font-hero text-3xl font-medium">Dashboard</h1>
<p class="mb-2">Welcome to Construct!</p>
<div
	class="flex flex-col gap-0.5 p-3 outline-primary-500"
	class:animate-outline-ping={data.shipCount == 0}
	class:outline={data.shipCount == 0}
	class:themed-box-solid-prominent={data.shipCount == 0}
	class:themed-box-solid={data.shipCount > 0}
>
	<h2 class="text-xl font-bold">Checklist</h2>
	<div class="flex flex-col gap-0.5">
		<ChecklistItem completed={data.projectCount > 0}
			><a href="/dashboard/projects/create" class="underline">Create</a> your first project</ChecklistItem
		>
		<ChecklistItem completed={data.devlogCount > 0}>Make your first journal entry</ChecklistItem>
		<ChecklistItem completed={data.shipCount > 0}>Ship your project</ChecklistItem>
	</div>
</div>
<div
	class="themed-box-solid-prominent mt-3 flex flex-col gap-0.5 p-3"
	class:themed-box-solid-prominent={data.shipCount > 0}
	class:themed-box-solid={data.shipCount == 0}
>
	<h2 class="text-xl font-bold">Guides & resources</h2>
	<p>Here are some guides and resources to help you out!</p>
	<ul class="list-inside list-disc">
		<li>
			<a
				href="https://cdn.hackclub.com/019ceec2-a0c1-765b-809a-1b690a8d20bf/image.png"
				class="list-link"
				target="_blank">CAD Design Tips for 3D Printing</a
			> - Billie Ruben
		</li>
		<li>
			<a
				href="https://wikifactory.com/+wikifactory/stories/ultimate-guide-how-to-design-for-3d-printing"
				target="_blank"
				class="list-link">How to Design for 3D Printing</a
			> - Wikifactory
		</li>
		<li>
			<a
				href="https://hackaday.com/2025/05/11/learn-15-print-in-place-mechanisms-in-15-minutes/"
				target="_blank"
				class="list-link">Learn 15 Print-in-place Mechanisms in 15 Minutes</a
			> - Slant 3D
		</li>
		<li>
			<a
				href="https://docs.google.com/presentation/d/1eTMoxJVEN_aZ3dzpWHGpPoI9JpMuOC8nArqn6dbEGfo"
				target="_blank"
				class="list-link">Gear Ratios Presentation</a
			>
		</li>
		<li>
			<a
				href="https://user-cdn.hackclub-assets.com/019ceebd-bf7b-7220-8971-e2e7ea1a3ee2/image.png"
				target="_blank"
				class="list-link">Bed Leveling Guide</a
			> - Billie Ruben
		</li>
	</ul>
</div>
<div class="themed-box mt-3 flex flex-col gap-0.5 p-3">
	<label class="flex flex-row items-center gap-1">
		<input type="checkbox" class="checkbox" bind:checked={enableModelRendering} />
		<span>Enable rendering 3D models</span>
	</label>
</div>
