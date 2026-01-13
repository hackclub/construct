<script lang="ts">
	import CharCountedTextarea from '$lib/components/CharCountedTextarea.svelte';

	import { SquarePen, ExternalLink, Trash, Ship, Lock, Download, Link } from '@lucide/svelte';
	import relativeDate from 'tiny-relative-date';
	import type { PageProps } from './$types';
	import Devlog from '$lib/components/Devlog.svelte';
	import { ALLOWED_IMAGE_TYPES, ALLOWED_MODEL_EXTS, MAX_UPLOAD_SIZE } from './config';
	import { projectStatuses } from '$lib/utils';
	import { enhance } from '$app/forms';
	import Head from '$lib/components/Head.svelte';
	import ProjectLinks from '$lib/components/ProjectLinks.svelte';
	import Spinny3DPreview from '$lib/components/Spinny3DPreview.svelte';

	const clamp = (num: number, min: number, max: number) => Math.min(Math.max(num, min), max);

	const PROJECT_STATUSES = ['submitted', 't1_approved', 'printing', 'printed', 'finalized'] as const;

	const PROGRESS_STEPS = [
		{ key: 'submitted', label: 'Submitted' },
		{ key: 't1_approved', label: 'On print queue' },
		{ key: 'printing', label: 'Being printed' },
		{ key: 'printed', label: 'Printed' },
		{ key: 'finalized', label: 'Payout' }
	] as const;

	let { data, form }: PageProps = $props();
	let sortDropdownValue = $state('descending');
	let sortDevlogsAscending = $derived.by(() => sortDropdownValue == 'ascending');

	let editable = $derived(data.project.status == 'building' || data.project.status == 'rejected');

	let description = $state(form?.fields?.description ?? '');

	let timeSpent = $state(
		form?.fields?.timeSpent?.toString()
			? (parseInt(form?.fields?.timeSpent?.toString()) ?? data.validationConstraints.timeSpent.min)
			: data.validationConstraints.timeSpent.min
	);

	function onchange() {
		timeSpent = clamp(
			timeSpent,
			data.validationConstraints.timeSpent.min,
			data.validationConstraints.timeSpent.currentMax
		);
	}

	function getStatusIndex(status: string): number {
		const index = PROJECT_STATUSES.indexOf(status as never);
		return index >= 0 ? index : 0;
	}

	let formPending = $state(false);
</script>

<Head title={data.project.name} />



<h1 class="mt-5 mb-2 font-hero text-3xl font-medium">{data.project.name}</h1>
<div class="mb-2">
	<p class="text-sm">
		Created
		<abbr title={`${data.project.createdAt.toUTCString()}`}>
			{relativeDate(data.project.createdAt)}
		</abbr>
		∙ Updated
		<abbr title={`${new Date(data.project.updatedAt).toUTCString()}`}>
			{relativeDate(data.project.updatedAt)}
		</abbr>
		∙ {Math.floor(data.project.timeSpent / 60)}h {data.project.timeSpent % 60}min
	</p>
	<p class="mt-0.5">Status: {projectStatuses[data.project.status]}</p>
</div>

<div class="mb-8 w-full px-0 sm:px-2 md:px-4 lg:px-8 xl:px-16 py-6">
	{#if data.project.status !== 'rejected' && data.project.status !== 'rejected_locked'}
	<div class="w-full flex flex-col items-stretch">
		<div class="relative w-full flex items-center" style="height: 44px;">
			<div 
				class="absolute z-0 top-1/2 -translate-y-1/2 left-[5%] right-[5%] h-2 bg-gray-200 rounded-full overflow-hidden"
				role="progressbar"
				aria-label="Project progress"
				aria-valuenow={getStatusIndex(data.project.status)}
				aria-valuemin={0}
				aria-valuemax={PROJECT_STATUSES.length - 1}
			>
				<div 
					class="h-2 bg-gradient-to-r from-primary-400 to-primary-600 transition-all duration-300" 
					style="width: calc((({getStatusIndex(data.project.status)}) / {PROJECT_STATUSES.length - 1}) * 100%)"
				></div>
			</div>
			{#each PROGRESS_STEPS as step, i (step.key)}
				<div class="flex-1 flex flex-col items-center min-w-0 relative z-10" style="position: absolute; left: calc(5% + (90% * {i} / {PROJECT_STATUSES.length - 1})); top: 50%; transform: translate(-50%, -50%);">
					<div
						class="w-7 h-7 rounded-full border-4 shadow-md transition-all duration-300"
						class:bg-primary-500={getStatusIndex(data.project.status) >= i}
						class:bg-gray-200={getStatusIndex(data.project.status) < i}
						class:border-primary-500={getStatusIndex(data.project.status) >= i}
						class:border-gray-300={getStatusIndex(data.project.status) < i}
						style="box-shadow: 0 2px 8px 0 rgba(0,0,0,0.07);"
					></div>
				</div>
			{/each}
		</div>
		<div class="relative w-full mt-3" style="height: 22px;">
			{#each PROGRESS_STEPS as step, i (step.key)}
				<div class="absolute w-max max-w-[20%] text-center left-0" style="left: calc(5% + (90% * {i} / {PROJECT_STATUSES.length - 1})); transform: translate(-50%, 0);">
					<span 
						class="text-xs font-semibold whitespace-nowrap"
						class:text-primary-700={getStatusIndex(data.project.status) >= i}
						class:text-gray-400={getStatusIndex(data.project.status) < i}
					>
						{step.label}
					</span>
				</div>
			{/each}
		</div>
	</div>
{/if}
</div>

<div class="flex flex-col xl:flex-row gap-3">
	<div class="mb-6 grow">
		<div class="my-2">
			<ProjectLinks
				url={data.project.url}
				editorFileType={data.project.editorFileType}
				editorUrl={data.project.editorUrl}
				uploadedFileUrl={data.project.uploadedFileUrl}
			/>
		</div>

		<p class="mt-2">
			{#each data.project.description?.split('\n') as descriptionSection}
				{descriptionSection}
				<br />
			{/each}
		</p>

		{#if data.project.userId === data.user.id}
			<div class="mt-3 flex gap-2">
				<a
					href={editable ? `/dashboard/projects/${data.project.id}/edit` : null}
					class={`button sm primary ${editable ? '' : 'disabled'}`}
					title={editable ? null : 'Currently locked as the project has been shipped'}
				>
					<SquarePen />
					Edit
				</a>
				<a
					href={editable ? `/dashboard/projects/${data.project.id}/ship` : null}
					class={`button sm orange ${editable ? '' : 'disabled'}`}
					title={editable ? null : 'Currently locked as the project has been shipped'}
				>
					<Ship />
					Ship
				</a>
				<a
					href={editable ? `/dashboard/projects/${data.project.id}/delete` : null}
					class={`button sm dark-red ${editable ? '' : 'disabled'}`}
					title={editable ? null : 'Currently locked as the project has been shipped'}
				>
					<Trash />
					Delete
				</a>
			</div>
		{/if}
	</div>

	{#if data.project.modelFile}
		<div class="max-h-120 min-h-full w-full xl:w-[60%]">
			<Spinny3DPreview
				identifier="project-model"
				modelUrl={data.s3PublicUrl + '/' + data.project.modelFile}
				sizeCutoff={8*1024*1024}
			/>
		</div>
	{/if}
</div>

{#if data.project.userId === data.user.id}
	<h3 class="mt-1 mb-1 text-xl font-semibold">Add entry</h3>
	{#if !editable}
		<div class="flex gap-1">
			<Lock size={20} />
			<p>Journaling is locked as the project has been shipped</p>
		</div>
	{:else if data.validationConstraints.timeSpent.currentMax >= data.validationConstraints.timeSpent.min}
		<form
			method="POST"
			class="flex flex-col gap-3"
			enctype="multipart/form-data"
			use:enhance={() => {
				formPending = true;
				return async ({ update }) => {
					await update();
					formPending = false;
				};
			}}
		>
			<div class="flex flex-col gap-2">
				<label class="flex flex-col gap-1">
					Time spent (minutes)
					<div class="flex gap-5">
						<div>
							<input
								name="timeSpent"
								type="number"
								bind:value={timeSpent}
								step="1"
								min={data.validationConstraints.timeSpent.min}
								max={data.validationConstraints.timeSpent.currentMax}
								{onchange}
								class="themed-box w-25 ring-primary-900 placeholder:text-primary-900 active:ring-3"
							/>
						</div>
						<input
							name="timeSpent"
							type="range"
							class="grow accent-primary-500"
							bind:value={timeSpent}
							step="1"
							min="0"
							{onchange}
							max={data.validationConstraints.timeSpent.max}
						/>
					</div>
					<p class="text-sm opacity-50">
						The minimum journal time is {data.validationConstraints.timeSpent.min} minutes, the maximum
						is
						{data.validationConstraints.timeSpent.max ==
						data.validationConstraints.timeSpent.currentMax
							? ''
							: 'currently'}
						{data.validationConstraints.timeSpent.currentMax}
					</p>
				</label>
				<label class="flex flex-col gap-1">
					Description
					<CharCountedTextarea
						name="description"
						placeholder="Describe what you changed"
						bind:value={description}
						min={data.validationConstraints.description.min}
						max={data.validationConstraints.description.max}
					/>
					{#if form?.invalid_description}
						<p class="mt-1 text-sm">
							Invalid description, must be between {data.validationConstraints.description.min} and {data
								.validationConstraints.description.max} characters
						</p>
					{/if}
				</label>
				<div class="mt-1 flex flex-row gap-2">
					<label class="flex grow flex-col gap-1">
						Image
						<input
							type="file"
							name="image"
							accept={ALLOWED_IMAGE_TYPES.join(', ')}
							class="themed-box p-1 outline-primary-900 focus:outline-1"
						/>
						{#if form?.invalid_image_file}
							<p class="mt-1 text-sm">
								Invalid file, must be a PNG or JPEG file under {MAX_UPLOAD_SIZE / 1024 / 1024} MiB
							</p>
						{:else}
							<p class="mt-1 text-sm opacity-50">
								Must be a PNG or JPEG file under {MAX_UPLOAD_SIZE / 1024 / 1024} MiB
							</p>
						{/if}
					</label>
					<label class="flex grow flex-col gap-1">
						3D model
						<input
							type="file"
							name="model"
							accept={ALLOWED_MODEL_EXTS.join(', ')}
							class="themed-box p-1 outline-primary-900 focus:outline-1"
						/>
						{#if form?.invalid_model_file}
							<p class="mt-1 text-sm">
								Invalid file, must be a STL, 3MF or OBJ file under {MAX_UPLOAD_SIZE / 1024 / 1024} MiB
							</p>
						{:else}
							<p class="mt-1 text-sm opacity-50">
								Must be a STL, 3MF (recommended) or OBJ file under {MAX_UPLOAD_SIZE / 1024 / 1024} MiB
							</p>
						{/if}
					</label>
				</div>
			</div>
			<button type="submit" class="button md primary" disabled={formPending}
				>Add journal entry!</button
			>
		</form>
	{:else}
		<p>
			You must work for at least {data.validationConstraints.timeSpent.min -
				data.validationConstraints.timeSpent.currentMax} more minutes to journal! [insert orpheus drawing]
		</p>
	{/if}
{/if}

<div class="mt-6 mb-5 flex flex-col gap-3">
	<div>
		<h2 class="text-2xl font-semibold">Journal entries</h2>
		{#if data.devlogs.length > 0}
			<div class="mt-1.5 flex">
				<select
					bind:value={sortDropdownValue}
					class="themed-box fill-primary-50 text-sm ring-primary-900 placeholder:text-primary-900 active:ring-3"
				>
					<option value="descending">New to old</option>
					<option value="ascending">Old to new</option>
				</select>
			</div>
		{/if}
	</div>

	{#if data.devlogs.length == 0}
		<div>
			No journal entries yet <img
				src="https://emoji.slack-edge.com/T0266FRGM/heavysob/55bf09f6c9d93d08.png"
				alt="heavysob"
				class="inline h-5.5"
			/>
		</div>
	{:else}
		{#each sortDevlogsAscending ? [...data.devlogs].reverse() : data.devlogs as devlog}
			<Devlog
				{devlog}
				projectId={data.project.id}
				showModifyButtons={data.project.userId == data.user.id}
				allowDelete={editable}
			/>
		{/each}
	{/if}
</div>
