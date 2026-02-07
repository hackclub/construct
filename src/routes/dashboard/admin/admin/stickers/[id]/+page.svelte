<script lang="ts">
	import relativeDate from 'tiny-relative-date';
	import Head from '$lib/components/Head.svelte';
	import DataCard from '$lib/components/DataCard.svelte';
	import { enhance } from '$app/forms';

	let { data } = $props();

	let user = $derived(data.queriedUser);

	let logoutPending = $state(false);
	let formPending = $state(false);
</script>

<Head title={'Stickers: ' + user.name} />

<div class="flex h-full flex-row gap-10">
	<div class="grow">
		<div class="flex grow flex-col gap-3">
			<h1 class="mt-5 font-hero text-2xl font-medium">{user.name}</h1>

			<div>
				<img
					src={user.profilePicture}
					alt="user profile"
					class="aspect-square h-45 rounded-xl border-4 border-primary-800 shadow-lg"
				/>
			</div>

			<div class="flex flex-row flex-wrap gap-3">
				<a href={`/dashboard/users/${user.id}`} class="button md primary">Public profile page</a>
				<a href={`../users/${user.id}`} class="button md primary">Admin profile page</a>

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
				<DataCard title="Stickers fulfilled">
					{user.stickersShipped ? 'Yes' : 'No'}
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
				<DataCard title="Referred by ID">
					{user.referralId ?? 'None'}
				</DataCard>
				<DataCard title="Clay">
					<code>{user.clay}</code>
				</DataCard>
				<DataCard title="Brick">
					<code>{user.brick}</code>
				</DataCard>
				<DataCard title="Market score">
					<code>{user.shopScore}</code>
				</DataCard>
			</div>

			<h2 class="mt-2 text-2xl font-bold">Fulfilment details</h2>
			<div>
				{#if data.pii}
					<div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
						<DataCard title="Name">
							{data.pii.first_name}
						</DataCard>
						<DataCard title="Surname">
							{data.pii.last_name}
						</DataCard>
						<DataCard title="Email">
							{data.pii.primary_email}
						</DataCard>
						<DataCard title="Phone number">
							<code>{data.pii.phone_number}</code>
						</DataCard>
						<DataCard title="Birthday">
							<code>{data.pii.birthday}</code>
						</DataCard>
					</div>

					<h3 class="mt-3 mb-2 text-xl font-bold">address</h3>

					<div class="themed-box p-3">
						{#if data.pii.address}
							<div>
								<p>
									<code>{data.pii.address.id}</code>
								</p>
								<p>
									{data.pii.address.first_name}
									{data.pii.address.last_name}
								</p>
								<p>
									{data.pii.address.line_1}
								</p>
								{#if data.pii.address.line_2}
									<p>
										{data.pii.address.line_2}
									</p>
								{/if}
								<p>
									{data.pii.address.city}, {data.pii.address.state}
									{data.pii.address.postal_code}
								</p>
								<p>
									{data.pii.address.country}
								</p>
							</div>
						{:else}
							<p>No address defined</p>
						{/if}
					</div>
				{:else}
					<p>Failed to fetch PII, ask them to re-login</p>
				{/if}
			</div>

			<h2 class="mt-2 text-2xl font-bold">Clicky button</h2>
			<div class="themed-box mb-5 p-3">
				<form
					action={user.stickersShipped ? "?/unfulfil" : "?/fulfil"}
					method="POST"
					use:enhance={() => {
						formPending = true;
						return async ({ update }) => {
							await update();
							formPending = false;
						};
					}}
				>
					<button type="submit" class="button md primary w-full" disabled={formPending}
						>{user.stickersShipped ? 'Unmark fulfilled' : 'Mark fulfilled'}</button
					>
				</form>
			</div>
		</div>
	</div>
</div>
