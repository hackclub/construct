<script>
	import Head from '$lib/components/Head.svelte';
</script>

<Head title="Auth failed" />

<div class="mt-10 text-center">
	<h1 class="text-2xl">Hackatime account not found</h1>

	<p>Make sure you have a Hackatime account associated with your Slack account.</p>
	<a href="https://hackatime.hackclub.com/" class="mr-3 underline">Make one?</a>
	<a href="/auth/idv" class="underline">Try again</a>
</div>
