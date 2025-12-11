<script lang="ts">
	import relativeDate from 'tiny-relative-date';
	import Devlog from '$lib/components/Devlog.svelte';
	import Head from '$lib/components/Head.svelte';
	import { ExternalLink } from '@lucide/svelte';
	import { enhance } from '$app/forms';
	import { projectStatuses } from '$lib/utils.js';

	let { data } = $props();

	let formPending = $state(false);
</script>

<Head title={'Review: ' + data.project.project.name} />

<div class="flex h-full flex-row gap-5">
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
					<div class="mt-1 flex">
						{#if data.project.project.url && data.project.project.url.length > 0}
							<a class="button sm primary" href={data.project.project.url} target="_blank">
								<ExternalLink />
								Link to project
							</a>
						{:else}
							<p class="font-bold">No Printables link</p>
						{/if}
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
					<p>{data.project.project.description}</p>
				</div>
			</div>

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
					onsubmit={() => {
						return confirm('really submit?');
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
						<textarea name="feedback" class="themed-input-on-box">{data.t1Reviews.length > 0 ? data.t1Reviews[data.t1Reviews.length - 1].feedback : ''}</textarea>
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
	<div class="w-50 min-w-50 overflow-scroll lg:w-65 lg:min-w-65">
		<div class="mb-5 flex flex-col gap-3">
			<h1 class="text-2xl font-bold">Review history</h1>
			{#each data.t1Reviews as review}
				<div class="themed-box flex flex-col p-3 shadow-lg">
					<p class="font-bold text-primary-400">{review.action}</p>
					<p class="text-sm"><span class="font-bold">Notes:</span> {review.notes}</p>
					<p class="text-sm"><span class="font-bold">Feedback:</span> {review.feedback}</p>
					<p class="text-xs">
						reviewed by <a href={`../../users/${review.user.id}`} class="underline"
							>{review.user.name}</a
						>
					</p>
				</div>
			{/each}
		</div>
	</div>
</div>
