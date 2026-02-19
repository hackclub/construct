<script lang="ts">
	import Head from '$lib/components/Head.svelte';
	import ovenpheus from '$lib/assets/ovenpheus.png';
	import { BRICKS_PER_HOUR, BRICKS_PER_HOUR_CONVERTED, CLAY_PER_HOUR } from '$lib/defs';
	import Printers from './Printers.svelte';
	import themeSong from '$lib/assets/construct-printer-market.mp3';

	let { data } = $props();

	let audio: HTMLAudioElement | null = $state(null);

	$effect(() => {
		if (audio) {
			audio.volume = 0.2;
			audio.play();
		}
	})
</script>

<Head title="Printer Market" />

<div class="flex h-full flex-col overflow-hidden">
	<h1 class="mt-5 mb-2 font-hero text-3xl font-medium">Printer market</h1>

	<p class="mb-2">
		Market score: <span class="rounded-xl bg-primary-800 px-2"
			>{Math.floor(data.user.shopScore)}</span
		>
		<span class="opacity-50">(allows you to get stuff for cheaper!)</span>
	</p>

	<!-- <h2 class="mb-2 text-2xl font-bold">Market items</h2> -->

	<audio loop bind:this={audio}>
		<source src={themeSong} type="audio/mp3" />
	</audio>

	<Printers />
</div>

<!-- <div class="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
		{#each data.marketItems as item (item.id)}
			<MarketItem {item} userShopScore={data.user.shopScore} userBricks={data.user.brick} />
		{/each}
	</div> -->
