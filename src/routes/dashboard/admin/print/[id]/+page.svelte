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

	let { data, form } = $props();

	let actionsFormPending = $state(false);
	let printFormPending = $state(false);
	let markForPrintPending = $state(false);
	let unmarkForPrintPending = $state(false);
</script>

<Head title={'Print: ' + data.project.project.name} />

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

			<h2 class="mt-2 text-2xl font-bold">Printering area</h2>

			{#if (data.project.project.status === 't1_approved' && !data.currentlyPrinting) || (data.project.project.status === 'printing' && data.project.project.printedBy === data.user.id)}
				<div class="themed-box flex flex-col gap-3 p-3">
					{#if data.project.project.status === 't1_approved' && !data.currentlyPrinting}
						<form
							method="POST"
							action="?/markForPrint"
							class="flex flex-col gap-3"
							use:enhance={() => {
								markForPrintPending = true;
								return async ({ update }) => {
									await update({ reset: false });
									markForPrintPending = false;
								};
							}}
						>
							<button type="submit" class="button md primary w-full" disabled={markForPrintPending}>
								I want to print this!
							</button>
						</form>
					{/if}
					{#if data.project.project.status === 'printing' && data.project.project.printedBy === data.user.id}
						<form
							method="POST"
							action="?/unmarkForPrint"
							class="flex flex-col gap-3"
							use:enhance={() => {
								unmarkForPrintPending = true;
								return async ({ update }) => {
									await update({ reset: false });
									unmarkForPrintPending = false;
								};
							}}
						>
							<button
								type="submit"
								class="button md primary w-full"
								disabled={unmarkForPrintPending}
							>
								nevermind i'm not printing ts
							</button>
						</form>
					{/if}
				</div>
			{/if}

			{#if data.project.project.status === 'printing' && data.project.project.printedBy === data.user.id}
				<h3 class="text-xl font-bold">Print</h3>
				<div class="themed-box flex flex-col gap-3 p-3">
					<form
						method="POST"
						action="?/print"
						class="flex flex-col gap-3"
						use:enhance={() => {
							printFormPending = true;
							return async ({ update }) => {
								await update({ reset: false });
								printFormPending = false;
							};
						}}
					>
						<label class="flex flex-col gap-1">
							<span class="font-medium">Filament used <span class="opacity-50">(grams)</span></span>
							<input
								name="filament"
								type="number"
								class="themed-input-on-box"
								placeholder="50"
								step="0.1"
								min="0"
								required
							/>
						</label>

						<label class="flex flex-col gap-1">
							<span class="font-medium">Notes <span class="opacity-50">(private)</span></span>
							<textarea name="notes" class="themed-input-on-box"></textarea>
						</label>

						<label class="flex flex-col gap-1">
							<span class="font-medium">Feedback <span class="opacity-50">(public)</span></span>
							<textarea name="feedback" class="themed-input-on-box"></textarea>
						</label>

						<!-- {#if form?.printForm?.message}
						<p>{form?.printForm?.message}</p>
						{/if} -->

						<button type="submit" class="button md primary w-full" disabled={printFormPending}>
							Submit!
						</button>
					</form>
				</div>
			{/if}

			{#if ['t1_approved', 'printing', 'printed'].includes(data.project.project.status)}
				<h3 class="text-xl font-bold">Other stuff</h3>
				<div class="themed-box flex flex-col gap-3 p-3">
					<form
						method="POST"
						action="?/action"
						class="flex flex-col gap-3"
						use:enhance={() => {
							actionsFormPending = true;
							return async ({ update }) => {
								await update({ reset: false });
								actionsFormPending = false;
							};
						}}
					>
						<label class="flex flex-col gap-1">
							<span class="font-medium">Action</span>
							<select class="themed-input-on-box text-sm" name="action" required>
								<option disabled selected>Select review action</option>
								<option value="already_printed">Already printed</option>
								<option value="add_comment">Add comment</option>
								<option value="reject">Send back to reviewers</option>
							</select>
						</label>
						<label class="flex flex-col gap-1">
							<span class="font-medium">Notes <span class="opacity-50">(private)</span></span>
							<textarea name="notes" class="themed-input-on-box"></textarea>
						</label>

						<label class="flex flex-col gap-1">
							<span class="font-medium">Feedback <span class="opacity-50">(public)</span></span>
							<textarea name="feedback" class="themed-input-on-box"></textarea>
						</label>

						<!-- {#if form?.actionsForm?.message}
						<p>{form?.actionsForm?.message}</p>
					{/if} -->

						<button type="submit" class="button md primary w-full" disabled={actionsFormPending}>
							Submit!
						</button>
					</form>
				</div>
			{/if}

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
