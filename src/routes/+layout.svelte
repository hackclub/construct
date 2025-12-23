<script lang="ts">
	import '../app.css';
	import { onDestroy, onMount } from 'svelte';

	let { children } = $props();
	let snowContainer: HTMLDivElement | null = null;
	let teardown: (() => void) | null = null;

	onMount(async () => {
		if (!snowContainer) return;

		try {
			const [{ createElement }, { default: Snowfall }, { createRoot }] = await Promise.all([
				import('react'),
				import('react-snowfall'),
				import('react-dom/client')
			]);

			if (!snowContainer) return;

			const root = createRoot(snowContainer);
			root.render(
				createElement(Snowfall, {
					color: ['#ffffff', '#e8f4f8', '#b3e5fc'].sort(() => Math.random() - 0.5)[0],
					snowflakeCount: 140,
					style: {
						position: 'fixed',
						inset: 0,
						width: '100vw',
						height: '100vh',
						pointerEvents: 'none'
					}
				})
			);

			teardown = () => root.unmount();
		} catch (error) {
			console.error('Snow overlay failed to load', error);
		}
	});

	onDestroy(() => {
		teardown?.();
	});
</script>

<div bind:this={snowContainer} aria-hidden="true"></div>

{@render children?.()}