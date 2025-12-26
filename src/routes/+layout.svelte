<script lang="ts">
	import '../app.css';
	import Snowfall from '$lib/components/Snowfall.svelte';

	let { children } = $props();
</script>

<Snowfall />

<div class="app-content">
	{@render children?.()}
</div>

<style>
	.app-content {
		position: relative;
		z-index: 1;
		min-height: 100dvh;
	}
	:global(html, body) {
		min-height: 100%;
	}
	:global(body) {
		position: relative;
	}
</style>