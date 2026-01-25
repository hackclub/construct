<script lang="ts">
	import SidebarButton from './SidebarButton.svelte';
	import {
		House,
		PencilRuler,
		Compass,
		LogOut,
		ClipboardPen,
		ClipboardPenLine,
		Store,
		ShieldUser,
		Box,
		Users
	} from '@lucide/svelte';
	import { page } from '$app/state';
	import logo from '$lib/assets/logo.png';

	let { user } = $props();

	let isOnOwnUserPage = $derived(
		page.url.pathname === `/dashboard/users/${user.id}` ||
			page.url.pathname === `/dashboard/users/${user.id}/`
	);
</script>

<div class="themed-box m-5 flex w-60 flex-none flex-col gap-2 rounded-xl p-3 shadow-lg/20 2xl:w-70">
	<div class="mb-0">
		<a href="/">
			<img src={logo} alt="logo" />
		</a>
	</div>
	<SidebarButton icon={House} href="/dashboard" exact>Home</SidebarButton>
	<SidebarButton icon={PencilRuler} href="/dashboard/projects">Projects</SidebarButton>
	<SidebarButton icon={Compass} href="/dashboard/explore">Explore</SidebarButton>
	<SidebarButton icon={Store} href="/dashboard/market">Market</SidebarButton>
	<SidebarButton icon={Users} href="/dashboard/clubs">Club</SidebarButton>
	{#if user.isPrinter}
		<SidebarButton icon={Box} href="/dashboard/admin/print" admin={true}>
			Print
		</SidebarButton>
	{/if}
	{#if user.hasT1Review}
		<SidebarButton icon={ClipboardPen} href="/dashboard/admin/review" admin={true}>
			Review
		</SidebarButton>
	{/if}
	{#if user.hasT2Review}
	<SidebarButton icon={ClipboardPenLine} href="/dashboard/admin/ysws-review" admin={true}>
	YSWS Review
	</SidebarButton>
	{/if}
	{#if user.hasAdmin}
		<SidebarButton icon={ShieldUser} href="/dashboard/admin/admin" admin={true}>
			Admin
		</SidebarButton>
	{/if}
	<div class="grow"></div>
	<a
		href={isOnOwnUserPage ? null : `/dashboard/users/${user.id}`}
		class={`flex h-15 flex-row gap-3 overflow-clip rounded-lg border-2 shadow-xl/3 transition-colors 2xl:h-16 ${isOnOwnUserPage ? 'border-primary-700 bg-primary-800' : 'border-primary-800 bg-primary-900 hover:bg-primary-800 hover:outline-2 hover:outline-primary-100'}`}
	>
		<div class="aspect-square">
			<img src={user.profilePicture} alt="User profile pic" class="aspect-square h-full" />
		</div>
		<div class="flex grow flex-col justify-center truncate">
			<p class="truncate font-medium">
				{user.name}
			</p>
			<p class="text-sm">{Math.floor(user.clay)} clay · {Math.floor(user.brick)} brick</p>
		</div>
	</a>
	<SidebarButton icon={LogOut} href="/auth/logout">Log out</SidebarButton>
</div>
