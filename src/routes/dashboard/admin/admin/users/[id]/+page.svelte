<script lang="ts">
	import relativeDate from 'tiny-relative-date';
	import Head from '$lib/components/Head.svelte';
	import DataCard from '$lib/components/DataCard.svelte';
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	let user = $derived(form?.queriedUser ?? data.queriedUser);

	let hackatimePending = $state(false);
	let currencyPending = $state(false);
	let privilegesPending = $state(false);
	let logoutPending = $state(false);
</script>

<Head title={'User: ' + user.name} />

<div class="flex h-full flex-row gap-10">
	<div class="grow">
		<div class="flex grow flex-col gap-3">
			<h1 class="mt-5 font-hero text-2xl font-medium">{user.name}</h1>

			<div>
				<img
					src={user.profilePicture}
					alt="user profile"
					class="h-45 rounded-xl border-4 border-primary-800 shadow-lg"
				/>
			</div>

			<div class="flex flex-row flex-wrap gap-3">
				<a href={`/dashboard/users/${user.id}`} class="button md primary">Public profile page</a>

				<div>
					<form
						action="?/refreshHackatime"
						method="POST"
						use:enhance={() => {
							hackatimePending = true;
							return async ({ update }) => {
								await update();
								hackatimePending = false;
							};
						}}
					>
						<button type="submit" class="button md primary" disabled={hackatimePending}
							>Refresh Hackatime trust</button
						>
					</form>
				</div>
				<div>
					<form
						action="?/logout"
						method="POST"
						use:enhance={() => {
							logoutPending = true;
							return async ({ update }) => {
								await update();
								logoutPending = false;
							};
						}}
					>
						<button type="submit" class="button md dark-red" disabled={logoutPending}
							>Log out user</button
						>
					</form>
				</div>
			</div>

			<h2 class="mt-2 text-2xl font-bold">User details</h2>

			<div
				class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
			>
				<DataCard title="Slack ID">
					<code
						><a
							class="underline"
							href={`https://hackclub.slack.com/team/${user.slackId}`}
							target="_blank">{user.slackId}</a
						></code
					>
				</DataCard>
				<DataCard title="IDV ID">
					<code>{user.idvId}</code>
				</DataCard>
				<DataCard title="Trust">
					{user.trust}
				</DataCard>
				<DataCard title="Hackatime trust">
					<a
						class="underline"
						href={`https://dash.fraud.land/profile/${user.slackId}`}
						target="_blank">{user.hackatimeTrust}</a
					>
				</DataCard>
				<DataCard title="Has base printer">
					{user.hasBasePrinter ? 'Yes' : 'No'}
				</DataCard>
				<DataCard title="Account created">
					<abbr title={`${user.createdAt.toUTCString()}`} class="relative z-2">
						{relativeDate(user.createdAt)}
					</abbr>
				</DataCard>
				<DataCard title="Last login">
					<abbr title={`${user.lastLoginAt.toUTCString()}`} class="relative z-2">
						{relativeDate(user.lastLoginAt)}
					</abbr>
				</DataCard>
				<DataCard title="Devlog count">
					{data.devlogCount}
				</DataCard>
			</div>

			<h2 class="mt-2 text-2xl font-bold">Currency stuff</h2>
			<div class="themed-box flex flex-col gap-3 p-3 shadow-lg">
				<form
					action="?/currency"
					method="POST"
					use:enhance={() => {
						currencyPending = true;
						return async ({ update }) => {
							await update({ reset: false });
							currencyPending = false;
						};
					}}
				>
					<div class="grid grid-cols-2 gap-3 lg:grid-cols-3">
						<label class="flex flex-col gap-1">
							<span class="font-medium text-sm">Clay</span>
							<input
								type="number"
								name="clay"
								value={form?.currency?.fields.clay ?? user.clay}
								class="themed-input-on-box"
								placeholder="Clay"
								step="0.1"
								required
							/>
						</label>
						<label class="flex flex-col gap-1">
							<span class="font-medium text-sm">Brick</span>
							<input
								type="number"
								name="brick"
								value={form?.currency?.fields.brick ?? user.brick}
								class="themed-input-on-box"
								placeholder="Brick"
								step="0.1"
								required
							/>
						</label>
						<label class="flex flex-col gap-1">
							<span class="font-medium text-sm">Market score</span>
							<input
								type="number"
								name="market_score"
								value={form?.currency?.fields.shopScore ?? user.shopScore}
								class="themed-input-on-box"
								placeholder="Market score"
								step="0.1"
								required
							/>
						</label>
					</div>
					{#if form?.currency?.invalidFields}
						<p class="w-full text-center text-sm">Invalid fields</p>
					{/if}
					<button type="submit" class="button md primary mt-3 w-full" disabled={currencyPending}
						>Apply!</button
					>
				</form>
			</div>

			<h2 class="mt-2 text-2xl font-bold">Privileges</h2>
			<div class="themed-box flex flex-col gap-3 p-3 shadow-lg">
				<form
					action="?/privileges"
					method="POST"
					use:enhance={() => {
						privilegesPending = true;
						return async ({ update }) => {
							await update({ reset: false });
							privilegesPending = false;
						};
					}}
				>
					<div class="grid grid-cols-2 lg:grid-cols-4">
						<label class="flex flex-row items-center gap-1">
							<input
								type="checkbox"
								name="has_t1_review"
								checked={user.hasT1Review}
								class="checkbox"
							/>
							<span class="font-medium">Has T1 review</span>
						</label>
						<label class="flex flex-row items-center gap-1">
							<input
								type="checkbox"
								name="has_t2_review"
								checked={user.hasT2Review}
								class="checkbox"
							/>
							<span class="font-medium">Has T2 review</span>
						</label>
						<label class="flex flex-row items-center gap-1">
							<input type="checkbox" name="has_admin" checked={user.hasAdmin} class="checkbox" />
							<span class="font-medium">Has admin</span>
						</label>
						<label class="flex flex-row items-center gap-1">
							<input
								type="checkbox"
								name="has_project_audit_logs"
								checked={user.hasProjectAuditLogs}
								class="checkbox"
							/>
							<span class="font-medium">Has project audit logs</span>
						</label>
					</div>
					<button type="submit" class="button md primary mt-3 w-full" disabled={privilegesPending}
						>Apply!</button
					>
				</form>
			</div>
		</div>
	</div>
</div>
