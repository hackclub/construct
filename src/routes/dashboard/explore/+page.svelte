<script lang="ts">
	import { onMount, tick } from 'svelte';
	import Devlog from '$lib/components/Devlog.svelte';
	import Head from '$lib/components/Head.svelte';

	let { data } = $props();

	let devlogs = $state([...data.devlogs]);
	let hasMore = $state(data.hasMore);
	let nextOffset = $state(data.nextOffset);
	let loadingMore = $state(false);
	let loadError = $state('');
	let sentinel = $state<HTMLDivElement | null>(null);
	let observer: IntersectionObserver | null = null;
	const rootMargin = '320px 0px';

	let devlogRefs = $state<(HTMLDivElement | null)[]>([]);
	let previewVisibility = $state(new Array(data.devlogs.length).fill(true));
	const PREVIEW_UNMOUNT_MARGIN = 1200;

	function hydrateDevlogs(rawDevlogs: typeof data.devlogs) {
		return rawDevlogs.map((entry) => ({
			...entry,
			devlog: {
				...entry.devlog,
				createdAt: new Date(entry.devlog.createdAt)
			}
		}));
	}

	function updatePreviewVisibility() {
		previewVisibility = devlogRefs.map((ref) => {
			if (!ref) return false;
			const rect = ref.getBoundingClientRect();
			return (
				rect.bottom > -PREVIEW_UNMOUNT_MARGIN &&
				rect.top < window.innerHeight + PREVIEW_UNMOUNT_MARGIN
			);
		});
	}

	async function loadMoreDevlogs() {
		if (loadingMore || !hasMore) return;
		loadingMore = true;
		loadError = '';
		try {
			const params = new URLSearchParams({ offset: `${nextOffset}` });
			const response = await fetch(`/dashboard/explore?${params.toString()}`);
			if (!response.ok) {
				throw new Error('Failed to load more devlogs');
			}
			const payload = await response.json();
			const incoming = hydrateDevlogs(payload.devlogs ?? []);
			devlogs = [...devlogs, ...incoming];
			previewVisibility = [...previewVisibility, ...new Array(incoming.length).fill(false)];
			nextOffset = payload.nextOffset ?? nextOffset + incoming.length;
			hasMore = Boolean(payload.hasMore);
			await tick();
			updatePreviewVisibility();
		} catch (error) {
			console.error(error);
			loadError = 'Could not load more right now.';
		} finally {
			loadingMore = false;
		}
	}

	onMount(() => {
		const onScroll = () => updatePreviewVisibility();
		window.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('resize', onScroll);
		tick().then(updatePreviewVisibility);

		if (!hasMore || !sentinel) return;

		observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						loadMoreDevlogs();
					}
				});
			},
			{ rootMargin }
		);

		observer.observe(sentinel);

		return () => {
			window.removeEventListener('scroll', onScroll);
			window.removeEventListener('resize', onScroll);
			observer?.disconnect();
		};
	});
</script>

<Head title="Explore" />

<h1 class="mt-5 mb-3 font-hero text-3xl font-medium">Explore</h1>


<div class="mt-3 mb-5 flex flex-col gap-3">
	{#if devlogs.length == 0}
		<div>
			No journal entries yet <img
				src="https://emoji.slack-edge.com/T0266FRGM/heavysob/55bf09f6c9d93d08.png"
				alt="heavysob"
				class="inline h-5.5"
			/>
		</div>
	{:else}
		{#each devlogs as devlog, i (devlog.devlog.id)}
			<div bind:this={devlogRefs[i]}>
				<Devlog
					devlog={devlog.devlog}
					projectId={devlog.project.id}
					projectName={devlog.project.name}
					user={devlog.user}
					showModifyButtons={false}
					allowDelete={false}
					show3DPreview={previewVisibility[i]}
				/>
			</div>
		{/each}
		<div bind:this={sentinel} class="h-1 w-full"></div>
		{#if loadingMore}
			<p class="text-sm opacity-70">Loading more...</p>
		{/if}
		{#if loadError}
			<div class="flex items-center gap-2 text-sm text-red-300">
				<span>{loadError}</span>
				<button class="button xs primary" type="button" onclick={loadMoreDevlogs}>
					Retry
				</button>
			</div>
		{/if}
		{#if !hasMore && !loadingMore}
			<p class="text-center text-sm opacity-70">You're caught up.</p>
		{/if}
	{/if}
</div>