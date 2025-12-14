<script lang="ts">
	import { page } from '$app/state';
	import { Download, ExternalLink, Link } from '@lucide/svelte';

	let { url, editorFileType, uploadedFileUrl, editorUrl } = $props();
</script>

<div class="flex flex-row gap-2">
	{#if url && url.length > 0}
		<div class="flex">
			<a class="button sm primary relative z-2" href={url} target="_blank">
				<ExternalLink />
				Printables page
			</a>
		</div>
	{/if}
	{#if editorFileType === 'upload'}
		<div class="flex">
			<a
				class="button sm primary relative z-2"
				href={`${page.data.s3PublicUrl}/${uploadedFileUrl}`}
				target="_blank"
			>
				<Download />
				Project file
			</a>
		</div>
	{:else if editorFileType === 'url'}
		<div class="flex">
			<a class="button sm primary relative z-2" href={editorUrl} target="_blank">
				<Link />
				Project link
			</a>
		</div>
	{/if}
</div>
