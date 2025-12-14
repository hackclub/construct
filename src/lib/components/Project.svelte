<script lang="ts">
	import { projectStatuses } from '$lib/utils';
	import { Download, ExternalLink, Link, Lock } from '@lucide/svelte';
	import relativeDate from 'tiny-relative-date';
	import { page } from '$app/state';
	import ProjectLinks from './ProjectLinks.svelte';

	interface Props {
		id: number;
		name: string | null;
		description: string | null;
		url: string | null;
		editorFileType: string | null;
		editorUrl: string | null;
		uploadedFileUrl: string | null;
		createdAt: Date;
		timeSpent: number;
		status: keyof typeof projectStatuses;
		clickable: boolean;
	}

	let {
		id,
		name,
		description,
		url,
		editorFileType,
		editorUrl,
		uploadedFileUrl,
		createdAt,
		timeSpent,
		status,
		clickable
	}: Props = $props();
</script>

<div
	class={`themed-box relative flex flex-col p-3 shadow-lg/20 transition-all ${clickable ? 'hover:scale-102' : ''}`}
>
	{#if clickable}
		<a class="absolute inset-0 z-1" href={`/dashboard/projects/${id}`} aria-label="project"></a>
	{/if}
	<h1 class="flex flex-row gap-1 text-xl font-semibold">
		<span class="grow truncate">{name}</span>
		{#if !(status == 'building' || status == 'rejected')}
			<span
				title={!(
					status == ('building' as keyof typeof projectStatuses) ||
					status == ('rejected' as keyof typeof projectStatuses)
				)
					? 'This project is currently locked as it has been shipped'
					: null}
				class="relative z-2"
			>
				<Lock />
			</span>
		{/if}
	</h1>
	<p class="mb-2 grow">{description}</p>
	<div class="mb-2">
		<ProjectLinks {url} {editorFileType} {editorUrl} {uploadedFileUrl} />
	</div>
	<div class="flex flex-row gap-4">
		<p class="grow text-sm">
			Created <abbr title={`${createdAt.toUTCString()}`} class="relative z-2">
				{relativeDate(createdAt)}
			</abbr>
			∙ {Math.floor(timeSpent / 60)}h {timeSpent % 60}min
		</p>
		<p class="text-sm">{projectStatuses[status]}</p>
	</div>
</div>
