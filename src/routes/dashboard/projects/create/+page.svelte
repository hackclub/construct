<script lang="ts">
	import { enhance } from '$app/forms';
	import Head from '$lib/components/Head.svelte';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();

	let formPending = $state(false);
</script>

<Head title="Create project" />

<h1 class="mt-5 mb-3 font-hero text-2xl font-medium">Create project</h1>
<form
	method="POST"
	class="flex flex-col gap-3"
	use:enhance={() => {
		formPending = true;
		return async ({ update }) => {
			await update();
			formPending = false;
		};
	}}
>
	<div>
		<label class="flex flex-col gap-1">
			Project name
			<input
				type="text"
				name="name"
				placeholder="Come up with an interesting name"
				required
				value={form?.fields?.name ?? ''}
				class="themed-box ring-primary-900 placeholder:text-primary-900 active:ring-3"
			/>
		</label>
		{#if form?.invalid_name}
			<p class="text-sm">Invalid name, must be between 1 and 80 characters</p>
		{/if}
	</div>
	<div>
		<label class="flex flex-col gap-1">
			<span>Description <span class="inline opacity-50">(optional)</span></span>
			<textarea
				name="description"
				placeholder="A couple sentences to describe your project"
				class="themed-box ring-primary-900 placeholder:text-primary-900 active:ring-3"
				>{form?.fields?.description ?? ''}</textarea
			>
		</label>
		{#if form?.invalid_description}
			<p class="text-sm">Invalid description, must be at most 1000 characters</p>
		{/if}
	</div>
	<button type="submit" class="button md primary mt-3 shadow-lg" disabled={formPending}>
		Create!
	</button>
</form>
