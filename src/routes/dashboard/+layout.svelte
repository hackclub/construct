<script lang="ts">
	import Sidebar from './Sidebar.svelte';
	import { ProgressBar } from '@prgm/sveltekit-progress-bar';

	let { children, data } = $props();
</script>

<ProgressBar class="text-primary-500" />

<div class="box-border flex h-[100svh] flex-row">
	<Sidebar user={data.user} />
	<div class="grow overflow-auto px-5 pt-5">
		{@render children?.()}
	</div>
</div>
