<script lang="ts">
	import Head from '$lib/components/Head.svelte';
	import { formatMinutes } from '$lib/utils.js';
	import { Building2, Clock, PencilRuler, UserRound } from '@lucide/svelte';

	let { data } = $props();
</script>

<Head title="Club stats" />

<div class="flex h-full flex-col">
	<h1 class="mt-5 mb-3 font-hero text-3xl font-medium">Club stats</h1>

	{#if data.clubs.length === 0}
		<div class="themed-box p-3 shadow-lg/20">No clubs found.</div>
	{:else}
		<div class="flex flex-col gap-4">
			{#each data.clubs as club (club.id)}
				<div class="themed-box flex flex-col gap-3 p-4 shadow-lg/20">
					<div class="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
						<div>
							<h2 class="flex items-center gap-2 text-2xl font-bold">
								<Building2 size={24} />
								{club.name}
							</h2>
						</div>
						<div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
							<div class="rounded-lg bg-primary-900 p-2">
								<p class="mb-1 flex items-center gap-1 text-xs opacity-70">
									<UserRound size={14} />
									Members
								</p>
								<p class="font-semibold">{club.memberCount}</p>
							</div>
							<div class="rounded-lg bg-primary-900 p-2">
								<p class="mb-1 flex items-center gap-1 text-xs opacity-70">
									<PencilRuler size={14} />
									Shipped projects
								</p>
								<p class="font-semibold">{club.shippedProjects}</p>
							</div>
							<div class="rounded-lg bg-primary-900 p-2">
								<p class="mb-1 flex items-center gap-1 text-xs opacity-70">
									<Clock size={14} />
									Shipped hours
								</p>
								<p class="font-semibold">{formatMinutes(club.totalMinutes)}</p>
							</div>
						</div>
					</div>

					<div>
						<h3 class="mb-2 text-lg font-semibold">Per-member shipped hours</h3>
						<div class="overflow-hidden rounded-lg border-2 border-primary-700">
							<table class="w-full border-collapse">
								<thead>
									<tr class="bg-primary-900/80 text-left text-sm">
										<th class="px-3 py-2 font-semibold">Member</th>
										<th class="px-3 py-2 font-semibold">Role</th>
										<th class="px-3 py-2 text-right font-semibold">Shipped hours</th>
									</tr>
								</thead>
								<tbody>
									{#each club.members as member (member.userId)}
										<tr class="border-t border-primary-800/80">
											<td class="px-3 py-2">
												<a
													href={`/dashboard/users/${member.userId}`}
													class="inline-flex items-center gap-2 hover:underline"
												>
													<img
														src={member.profilePicture}
														alt={member.name}
														class="h-7 w-7 rounded-full"
													/>
													<span>{member.name}</span>
												</a>
											</td>
											<td class="px-3 py-2 capitalize">{member.role}</td>
											<td class="px-3 py-2 text-right">{formatMinutes(member.shippedMinutes)}</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
