<script lang="ts">
	import Head from '$lib/components/Head.svelte';
	import { Users } from '@lucide/svelte';

	let { data } = $props();
</script>

<Head title="Admin" />

<div class="flex h-full flex-col">
	<h1 class="mt-5 mb-3 font-hero text-3xl font-medium">Admin</h1>

	<div class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
		<a
			class="themed-box flex flex-col items-center justify-center gap-2 p-3 shadow-xl transition-transform hover:scale-105"
			href="/dashboard/admin/admin/users"
		>
			<div>
				<Users size={40} />
			</div>
			<p class="text-2xl font-bold">Users</p>
		</a>
	</div>
</div>
