<script lang="ts">
	import { Square, SquareCheckBig } from '@lucide/svelte';
	let { children, completed } = $props();
</script>

<div class="flex flex-row gap-1">
	<div>
		{#if completed}
			<SquareCheckBig />
		{:else}
			<Square />
		{/if}
	</div>
	<p>{@render children()}</p>
</div>
