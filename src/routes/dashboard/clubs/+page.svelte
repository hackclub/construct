<script lang="ts">
	import Head from '$lib/components/Head.svelte';
	import { enhance } from '$app/forms';
	import { page } from '$app/state';

	let { data, form } = $props();

	let joinCode = $state('');
	let isLinking = $state(false);
	let isJoining = $state(false);
	let isRegenerating = $state(false);

	$effect(() => {
		const urlCode = page.url.searchParams.get('code');
		if (urlCode && !data.linked) {
			joinCode = urlCode;
		}
	});

	function getJoinUrl(code: string) {
		return `${typeof window !== 'undefined' ? window.location.origin : ''}/dashboard/clubs/join?code=${encodeURIComponent(code)}`;
	}

	let copied = $state(false);
	function copyJoinLink() {
		if (data.linked && data.joinCode) {
			navigator.clipboard.writeText(getJoinUrl(data.joinCode));
			copied = true;
			setTimeout(() => (copied = false), 2000);
		}
	}
</script>

<Head title="Club" />

<h1 class="mt-5 mb-3 font-hero text-3xl font-medium">Club</h1>

{#if !data.linked}
	<div class="themed-box flex flex-col gap-3 p-4">
		<div>
			<h2 class="mb-1 text-xl font-bold">Link Your Club</h2>
			<p>
				Connect your Hack Club to track hours and collaborate with your team.
			</p>
		</div>

		<div class="flex flex-col gap-4 md:flex-row">
			<div class="flex-1 rounded-lg border-3 border-primary-700 p-4 flex flex-col">
				<h3 class="mb-1 font-bold">Club Leaders</h3>
				<p class="mb-2 text-sm">
					If you're a club leader, we'll automatically find your club.
				</p>
				<div class="grow"></div>
				<form
					method="POST"
					action="?/linkLeader"
					use:enhance={() => {
						isLinking = true;
						return async ({ update }) => {
							await update();
							isLinking = false;
						};
					}}
				>
					<button type="submit" class="button md primary" disabled={isLinking}>
						{isLinking ? 'Linking...' : 'Link as Leader'}
					</button>
				</form>
				{#if form?.notALeader}
					<p class="mt-2 text-sm text-red-400">
						You don't appear to be a club leader. Ask your leader for a join code.
					</p>
				{/if}
			</div>

			<div class="flex-1 rounded-lg border-3 border-primary-700 p-4">
				<h3 class="mb-2 font-bold">Club Members</h3>
				<p class="mb-3 text-sm">Enter the join code from your club leader.</p>
				<form
					method="POST"
					action="?/joinByCode"
					use:enhance={() => {
						isJoining = true;
						return async ({ update }) => {
							await update();
							isJoining = false;
						};
					}}
					class="flex gap-2"
				>
					<input
						type="text"
						name="code"
						bind:value={joinCode}
						placeholder="Join code"
						class="themed-input-on-box flex-1"
					/>
					<button
						type="submit"
						class="button md primary justify-center flex flex-col"
						disabled={isJoining || !joinCode.trim()}
					>
						{isJoining ? 'Joining...' : 'Join'}
					</button>
				</form>
				{#if form?.invalidCode}
					<p class="mt-2 text-sm text-red-400">
						Invalid join code. Please check with your club leader.
					</p>
				{/if}
			</div>
		</div>

		{#if form?.alreadyLinked}
			<p class="text-sm text-yellow-400">
				You're already linked to a club. Refresh to see your club.
			</p>
		{/if}
	</div>
{:else}
	<div class="themed-box flex flex-col gap-4 p-4">
		<div class="flex items-center justify-between">
			<div>
				<h2 class="text-2xl font-bold">{data.clubName}</h2>
				<p class="">
					{data.role === 'leader' ? 'Leader' : 'Member'}
				</p>
			</div>
			<div class="text-right">
				<p class="text-3xl font-bold text-primary-300">{data.totalHours}</p>
				<p class="text-sm opacity-80">club hours</p>
			</div>
		</div>
	</div>

	{#if data.role === 'leader'}
		<div class="themed-box mt-3 flex flex-col gap-3 p-4">
			<h3 class="font-bold">Leader Tools</h3>

			{#if data.joinCode}
				<div>
					<p class="mb-2 text-sm">Share this link to invite members:</p>
					<div class="flex gap-2">
						<input
							type="text"
							readonly
							value={getJoinUrl(data.joinCode)}
							class="themed-input-on-box flex-1 px-3 py-2 text-sm"
						/>
						<button type="button" class="button md primary" onclick={copyJoinLink}>
							{copied ? 'Copied!' : 'Copy'}
						</button>
						<form
							method="POST"
							action="?/regenerateJoinCode"
							use:enhance={() => {
								isRegenerating = true;
								return async ({ update }) => {
									await update();
									isRegenerating = false;
								};
							}}
						>
							<button type="submit" class="button md orange" disabled={isRegenerating}>
								{isRegenerating ? '...' : 'Regenerate'}
							</button>
						</form>
					</div>
				</div>
			{/if}

			{#if data.totalHours >= 50}
				<div class="mt-2 rounded-lg border-2 border-green-600 bg-green-900/30 p-4">
					<h4 class="mb-2 font-bold text-green-400">🎉 Congratulations!</h4>
					<p class="mb-3 text-sm">
						Your club has reached 50+ hours! You're eligible to request a 3D printer.
					</p>
					<a
						href="https://forms.hackclub.com/clubs-printer-request"
						target="_blank"
						rel="noopener noreferrer"
						class="button md primary inline-block"
					>
						Request Printer →
					</a>
				</div>
			{/if}
		</div>
	{/if}

	<div class="themed-box mt-3 flex flex-col gap-3 p-4">
		<h3 class="font-bold">Members ({data.members?.length ?? 0})</h3>
		<div class="flex flex-col gap-2">
			{#each data.members ?? [] as member}
				<a
					href="/dashboard/users/{member.id}"
					class="flex items-center gap-3 rounded-lg bg-primary-900 p-2 transition-colors hover:bg-primary-800"
				>
					<img src={member.profilePicture} alt={member.name} class="h-10 w-10 rounded-full" />
					<div class="flex-1">
						<p class="font-medium">{member.name}</p>
						<p class="text-sm opacity-80">
							{member.role === 'leader' ? 'Leader' : 'Member'}
						</p>
					</div>
				</a>
			{/each}
		</div>
	</div>
{/if}
