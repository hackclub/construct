<script lang="ts">
	import Head from '$lib/components/Head.svelte';
	import { onMount, onDestroy } from 'svelte';

	let timeLeft = $state({ days: 0, hours: 0, minutes: 0, seconds: 0 });
	let isCountdownOver = $state(false);
	let interval: ReturnType<typeof setInterval>;

	const targetDate = new Date('2025-12-15T23:59:00-05:00').getTime();

	function updateTimer() {
		const now = new Date().getTime();
		const distance = targetDate - now;

		if (distance < 0) {
			timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };
			isCountdownOver = true;
			if (interval) clearInterval(interval);
			return;
		}

		timeLeft = {
			days: Math.floor(distance / (1000 * 60 * 60 * 24)),
			hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
			minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
			seconds: Math.floor((distance % (1000 * 60)) / 1000)
		};
	}

	onMount(() => {
		updateTimer();
		interval = setInterval(updateTimer, 1000);
	});

	onDestroy(() => {
		if (interval) clearInterval(interval);
	});
</script>

<Head title="Countdown" />

<div class="my-12 flex flex-col items-center justify-center">
	{#if isCountdownOver}
		<h2 class="mb-6 font-hero text-xl text-primary-300 md:text-2xl">The countdown is over!</h2>
		<div class="themed-box max-w-2xl p-8 text-center">
			<p class="mb-4 text-lg text-primary-100">
				Please wait patiently for Construct to start. It will be announced later today in
				<a
					href="https://hackclub.enterprise.slack.com/archives/C0A02DFLVNW"
					target="_blank"
					rel="noopener noreferrer"
					class="font-bold text-primary-300 underline hover:text-primary-400"
				>
					#construct-announcements
				</a>
			</p>
		</div>
		<a href="/" class="mt-10 underline">Go back home</a>
	{:else}
		<h2 class="mb-6 font-hero text-xl text-primary-300 md:text-2xl">Countdown to Construct!</h2>
		<div class="grid grid-cols-2 gap-4 text-center font-hero text-primary-50 md:grid-cols-4">
			<div class="themed-box flex min-w-[120px] flex-col items-center justify-center p-4">
				<span class="mb-2 text-4xl md:text-5xl">{timeLeft.days}</span>
				<span class="text-xs text-primary-400 md:text-sm">DAYS</span>
			</div>
			<div class="themed-box flex min-w-[120px] flex-col items-center justify-center p-4">
				<span class="mb-2 text-4xl md:text-5xl">{timeLeft.hours}</span>
				<span class="text-xs text-primary-400 md:text-sm">HOURS</span>
			</div>
			<div class="themed-box flex min-w-[120px] flex-col items-center justify-center p-4">
				<span class="mb-2 text-4xl md:text-5xl">{timeLeft.minutes}</span>
				<span class="text-xs text-primary-400 md:text-sm">MINS</span>
			</div>
			<div class="themed-box flex min-w-[120px] flex-col items-center justify-center p-4">
				<span class="mb-2 text-4xl md:text-5xl">{timeLeft.seconds}</span>
				<span class="text-xs text-primary-400 md:text-sm">SECS</span>
			</div>
		</div>
		<a href="/" class="mt-10 underline">Go back home</a>
	{/if}
</div>
