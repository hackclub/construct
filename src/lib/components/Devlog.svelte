<script lang="ts">
	// https://github.com/3daddict/stl-viewer/ and https://tonybox.net/posts/simple-stl-viewer/ for stl viewer code

	import relativeDate from 'tiny-relative-date';
	import { SquarePen, Trash } from '@lucide/svelte';
	import { page } from '$app/state';
	import Spinny3DPreview from './Spinny3DPreview.svelte';

	let {
		devlog,
		projectId,
		showModifyButtons,
		allowDelete = true,
		projectName = null,
		user = null,
		show3DPreview = true
	} = $props();
</script>

<div
	class="themed-box relative flex flex-col p-3 shadow-lg/20 transition-all"
	id={`devlog-${devlog.id}`}
>
	<p class="mb-0.5 text-sm opacity-90">
		{#if user}
			<a href={`/dashboard/users/${user.id}#devlog-${devlog.id}`} class="truncate underline"
				>{user.name}</a
			> ∙
		{/if}
		{#if projectName}
			<a href={`/dashboard/projects/${projectId}#devlog-${devlog.id}`} class="truncate underline"
				>{projectName}</a
			> ∙
		{/if}
		<abbr title={`${devlog.createdAt.toUTCString()}`}>
			{relativeDate(devlog.createdAt)}
		</abbr>
		∙ {devlog.timeSpent} minutes
	</p>
	<p>
		{devlog.description}
	</p>
	<div class="my-1 flex flex-col gap-3 lg:flex-row">
		<!-- svelte-ignore a11y_img_redundant_alt -->
		<div
			class={`flex max-h-100 w-full grow flex-row justify-center border-3 border-primary-900 ${devlog.model ? 'lg:max-w-[55%]' : ''}`}
		>
			<div class="flex justify-center">
				<img
					src={`${page.data.s3PublicUrl}/${devlog.image}`}
					alt="Journal image"
					class="max-h-full max-w-full object-contain"
				/>
			</div>
		</div>
		{#if devlog.model && show3DPreview}
			<div
				class="relative max-h-100 w-full grow border-3 border-primary-900 lg:w-100 lg:max-w-[60%]"
			>
				<Spinny3DPreview
					identifier={`canvas-${devlog.id}`}
					modelUrl={page.data.s3PublicUrl + '/' + devlog.model}
				/>
			</div>
		{/if}
	</div>
	{#if showModifyButtons}
		<div class="mt-1 flex flex-row gap-1">
			<a
				href={`/dashboard/projects/${projectId}/devlog/${devlog.id}/edit`}
				class="button xs primary"
			>
				<SquarePen />
				Edit
			</a>
			<a
				href={allowDelete ? `/dashboard/projects/${projectId}/devlog/${devlog.id}/delete` : null}
				class={`button xs dark-red ${allowDelete ? '' : 'disabled'}`}
				title={allowDelete ? null : 'Currently locked as the project has been shipped'}
			>
				<Trash />
				Delete
			</a>
		</div>
	{/if}
</div>
