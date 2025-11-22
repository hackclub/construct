<script lang="ts">
	import relativeDate from 'tiny-relative-date';
	import Devlog from '$lib/components/Devlog.svelte';

	let { data } = $props();
</script>

<div class="flex h-full flex-row gap-10">
	<div class="grow">
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
			<div class="themed-box flex flex-col gap-3 p-3">coming soon</div>

			<h2 class="mt-2 text-2xl font-bold">Journal logs</h2>
			<div class="flex flex-col gap-5">
				{#each data.devlogs as devlog}
					<Devlog {devlog} projectId={devlog.projectId} showModifyButtons={false} />
				{/each}
			</div>
		</div>

		<!-- not sure why it doesn't want to work otherwise, it's really weird -->
		<div class="invisible text-xs">hello :)</div>
	</div>
	<div class="flex w-50 min-w-50 flex-col gap-5 lg:w-65 lg:min-w-65">
		<div class="themed-box flex flex-col items-center gap-2 p-5 shadow-lg/20">
			<h1 class="text-2xl font-bold">Review history</h1>
			coming soon
		</div>
		<!-- <div class="themed-box flex flex-col items-center gap-2 p-3 shadow-lg/20">
			<h1 class="text-xl font-semibold">Projects</h1>
		</div> -->
	</div>
</div>
