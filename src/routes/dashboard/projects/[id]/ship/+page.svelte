<script lang="ts">
	import { enhance } from '$app/forms';
	import ChecklistItem from '$lib/components/ChecklistItem.svelte';
	import Head from '$lib/components/Head.svelte';
	import Project from '$lib/components/Project.svelte';
	import { MAX_UPLOAD_SIZE } from '../config';
	import type { PageProps } from './$types';
	import { Ship, SquarePen } from '@lucide/svelte';

	let { data, form }: PageProps = $props();

	let formPending = $state(false);

	let printablesUrl = $state(data.project.url);
	let editorUrl = $state(data.project.editorUrl);
	let editorUploadFile = $state(null);
	let modelFile = $state(null);

	let hasEditorFile = $derived((editorUrl || editorUploadFile) && !(editorUrl && editorUploadFile));
</script>

<Head title="Ship project" />

<h1 class="mt-5 mb-3 font-hero text-2xl font-medium">Ship project</h1>
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
<div class="mt-3 flex flex-row">
	<a href="edit" class="button sm primary">
		<SquarePen />
		Edit
	</a>
</div>

<form
	method="POST"
	class="mt-3 flex flex-col gap-1"
	enctype="multipart/form-data"
	use:enhance={() => {
		formPending = true;
		return async ({ update }) => {
			await update({ reset: false });
			formPending = false;
		};
	}}
>
	<div>
		<label class="flex flex-col gap-1">
			<span>Printables URL</span>
			<input
				type="text"
				name="printables_url"
				placeholder="https://www.printables.com/model/244385-flying-orpheus"
				bind:value={printablesUrl}
				class={`themed-input-on-box ${form?.invalid_printables_url || form?.invalid_license ? 'border-primary-500' : ''}`}
			/>
		</label>
		<div class="mt-1 text-primary-500">
			{#if form?.invalid_printables_url}
				<p class="text-sm">Invalid Printables URL</p>
			{:else if form?.invalid_license}
				<p class="text-sm">License not allowed, see below! You don't want Orpheus chasing you, do you?</p>
			{/if}
		</div>
	</div>

	<div class="mt-2">
		<p>Editor file <span class="opacity-50">(provide a link or upload a file)</span></p>

		<div class="themed-box mt-1 p-3">
			<div>
				<label class="flex flex-col gap-1">
					<input
						type="text"
						name="editor_url"
						placeholder="https://cad.onshape.com/documents/14f82e23135e1e8bfe2305e0/w/28766465f00bd1d2079ae445/e/1d112b7ff9c457c1556814fd"
						bind:value={editorUrl}
						class="themed-input-on-box"
					/>
				</label>
				{#if form?.invalid_editor_url}
					<p class="mt-1 text-sm">Invalid URL</p>
				{/if}
			</div>

			<p class="mt-1 text-sm">or <span class="opacity-50">(but not both)</span></p>

			<div>
				<div class="mt-1 flex flex-row gap-2">
					<label class="flex grow flex-col gap-1">
						<input
							type="file"
							name="editor_file"
							bind:value={editorUploadFile}
							class="themed-input-on-box p-1 focus:outline-1"
						/>
					</label>
					<div>
						<button
							class="h-full cursor-pointer rounded-lg bg-primary-800 px-2 outline-primary-50 hover:bg-primary-700 hover:outline-3 focus:outline-3"
							onclick={() => {
								editorUploadFile = null;
							}}>Clear</button
						>
					</div>
				</div>
				<div class="mt-1">
					{#if form?.invalid_editor_file}
						<p class="text-sm">
							Invalid file, must be under {MAX_UPLOAD_SIZE / 1024 / 1024} MiB. Provide a link instead!
						</p>
					{:else}
						<p class="text-sm opacity-50">
							e.g. orpheus.f3d, monkey.blend (must be under {MAX_UPLOAD_SIZE / 1024 / 1024} MiB)
						</p>
					{/if}
				</div>
			</div>
		</div>
	</div>

	<label class="mt-2 flex grow flex-col gap-1">
		<p>
			3D model <span class="opacity-50">(for previews)</span>
		</p>
		<input
			type="file"
			name="model_file"
			accept=".3mf"
			bind:value={modelFile}
			class="themed-input-on-box p-1"
		/>
		{#if form?.invalid_model_file}
			<p class="mt-0.5 text-sm">
				Invalid file, must be a 3MF file under {MAX_UPLOAD_SIZE / 1024 / 1024} MiB
			</p>
		{:else}
			<p class="mt-0.5 text-sm opacity-50">
				Must be a 3MF file under {MAX_UPLOAD_SIZE / 1024 / 1024} MiB
			</p>
		{/if}
	</label>

	<div class="mt-3">
		<h2 class="mb-1 text-xl font-bold">Requirements</h2>
		<ChecklistItem completed={data.project.timeSpent >= 120}
			>At least 120 minutes spent</ChecklistItem
		>
		<ChecklistItem completed={data.project.description != ''}>
			Project has a description
		</ChecklistItem>
		<ChecklistItem completed={printablesUrl}>Project has a Printables URL</ChecklistItem>
		<ChecklistItem completed={hasEditorFile}
			>Project has an editor file or URL
			{#if editorUrl && editorUploadFile}
				<span class="opacity-50">(you can't have both at the same time, silly!)</span>
			{/if}
		</ChecklistItem>
		<ChecklistItem completed={modelFile}>Project has a 3D model</ChecklistItem>

		<p class="mt-1">
			Make sure that your project has a license that <span class="font-bold">allows remixes</span>
			and <span class="font-bold">meets the open definition</span> or Orpheus will come after you with
			a stick. I'd recommend using CC-BY-SA!
		</p>
		<div class="mt-2 mb-1">
			{#if data.project.timeSpent >= 120 && data.project.description != '' && data.project.url != ''}
				<p class="text-primary-300">
					Are you sure you want to ship "{data.project.name}"?
					<span class="font-bold">You won't be able to edit it or journal again</span> unless it gets
					rejected.
				</p>
			{/if}
		</div>
	</div>
	<div class="flex flex-row gap-2">
		<div>
			<a href="./" class="button sm primary">Cancel</a>
		</div>
		<button
			class="button sm orange"
			disabled={formPending ||
				data.project.timeSpent < 120 ||
				data.project.description == '' ||
				!printablesUrl ||
				!hasEditorFile ||
				!modelFile}
		>
			<Ship />
			Ship
		</button>
	</div>
</form>
