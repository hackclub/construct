<script lang="ts">
	import relativeDate from 'tiny-relative-date';
	import Devlog from '$lib/components/Devlog.svelte';
	import Head from '$lib/components/Head.svelte';
	import { enhance } from '$app/forms';
	import { projectStatuses } from '$lib/utils.js';
	import ProjectLinks from '$lib/components/ProjectLinks.svelte';
	import Spinny3DPreview from '$lib/components/Spinny3DPreview.svelte';
	import { Download } from '@lucide/svelte';
	import ReviewHistory from '../../ReviewHistory.svelte';

	let { data } = $props();

	let formPending = $state(false);
</script>

<Head title={'Review: ' + data.project.project.name} />

<div
	class="-mt-5 -mr-5 flex h-full flex-row [&>*]:-mb-5 [&>*]:overflow-x-clip [&>*]:pt-5 [&>*]:pr-5"
>
	<div class="grow overflow-scroll">
		<div class="flex grow flex-col gap-3">
			<h1 class="mt-5 font-hero text-2xl font-medium">{data.project.project.name}</h1>

			<h2 class="mt-2 text-2xl font-bold">Project details</h2>
			<div class="themed-box flex flex-col gap-3 p-3">
				<div>
					<p>
						Created
						<abbr title={`${data.project.project.createdAt.toUTCString()}`}>
							{relativeDate(data.project.project.createdAt)}
						</abbr>
						∙ Updated
						<abbr title={`${new Date(data.project.project.updatedAt).toUTCString()}`}>
							{relativeDate(data.project.project.updatedAt)}
						</abbr>
					</p>
					<p>
						{data.project.devlogCount} logs ∙ {Math.floor(data.project.timeSpent / 60)}h {data
							.project.timeSpent % 60}min
					</p>
					<p>Status: {projectStatuses[data.project.project.status]}</p>
					<div class="mt-1">
						<ProjectLinks
							url={data.project.project.url}
							editorFileType={data.project.project.editorFileType}
							editorUrl={data.project.project.editorUrl}
							uploadedFileUrl={data.project.project.uploadedFileUrl}
						/>
					</div>
				</div>

				<div>
					<h2 class="text-lg font-bold">User</h2>
					<p>
						by <a class="underline" href={`/dashboard/users/${data.project.user?.id}`}
							>{data.project.user?.name}</a
						>
					</p>
					<p>
						Slack ID: <a
							class="underline"
							href={`https://hackclub.slack.com/team/${data.project.user?.slackID}`}
							target="_blank">{data.project.user?.slackID}</a
						>
					</p>
					<p>Trust: {data.project.user?.trust}</p>
					<p>
						Hackatime trust: <a
							class="underline"
							href={`https://dash.fraud.land/profile/${data.project.user?.slackID}`}
							target="_blank">{data.project.user?.hackatimeTrust}</a
						>
					</p>
				</div>

				<div>
					<h2 class="text-lg font-bold">Description</h2>
					<p>
						{#each data.project.project.description?.split('\n') as descriptionSection}
							{descriptionSection}
							<br />
						{/each}
					</p>
				</div>
			</div>

			{#if data.project.project.modelFile}
				<div class="mt-2 flex flex-row">
					<h2 class="grow text-2xl font-bold">3D model</h2>
					<a
						href={`${data.s3PublicUrl}/${data.project.project.modelFile}`}
						download
						class="button primary flex flex-col justify-center rounded-lg px-3 hover:outline-3 focus:outline-3"
					>
						<Download />
					</a>
				</div>

				<div class="themed-box flex h-100 flex-col gap-3 overflow-clip">
					<Spinny3DPreview
						identifier="model"
						modelUrl={`${data.s3PublicUrl}/${data.project.project.modelFile}`}
						sizeCutoff={8 * 1024 * 1024}
					/>
				</div>
			{/if}

			<h2 class="mt-2 text-2xl font-bold">Review</h2>
			<div class="themed-box flex flex-col gap-3 p-3">
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
					<label class="flex flex-col gap-1">
						<span class="font-medium">Action</span>
						<select class="themed-input-on-box text-sm" name="action" required>
							<option disabled selected>Select review action</option>
							<option value="approve">Approve</option>
							<option value="approve_no_print">Approve (no printing required)</option>
							<option value="add_comment">Add comment</option>
							<option value="reject">Reject</option>
							<option value="reject_lock">Reject + lock project</option>
						</select>
					</label>

					<label class="flex flex-col gap-1">
						<span class="font-medium">Notes <span class="opacity-50">(internal)</span></span>
						<textarea name="notes" class="themed-input-on-box"></textarea>
					</label>

					<label class="flex flex-col gap-1">
						<span class="font-medium">Feedback <span class="opacity-50">(public)</span></span>
						<textarea name="feedback" class="themed-input-on-box"
							>{data.reviews.t1Reviews.length > 0
								? data.reviews.t1Reviews[data.reviews.t1Reviews.length - 1].feedback
								: ''}</textarea
						>
					</label>

					<button type="submit" class="button md primary w-full" disabled={formPending}>
						Submit!
					</button>
				</form>
			</div>

			<h2 class="mt-2 text-2xl font-bold">Journal logs</h2>
			<div class="mb-5 flex flex-col gap-5">
				{#each data.devlogs as devlog}
					<Devlog {devlog} projectId={devlog.projectId} showModifyButtons={false} />
				{/each}
			</div>
		</div>
	</div>
	<div class="w-60 min-w-60 overflow-scroll lg:w-70 lg:min-w-70">
		<ReviewHistory reviews={data.reviews} />
	</div>
</div>
