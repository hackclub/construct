<script>
	import Head from '$lib/components/Head.svelte';

	let { data } = $props();
</script>

<Head title="Ineligible" />

<div class="mt-10 text-center">
	<h1 class="text-2xl">Ineligible</h1>

	<p>Sorry, you're ineligible to take part in this event until you get verified.</p>
	<a href={`https://${data.idvDomain}`} class="underline">Get verified</a>
</div>
