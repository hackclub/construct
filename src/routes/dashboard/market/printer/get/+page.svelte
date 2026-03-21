<script lang="ts">
	import { enhance } from '$app/forms';
	import Head from '$lib/components/Head.svelte';
	import Project from '$lib/components/Project.svelte';
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';
	import { Trash } from '@lucide/svelte';
	import { getPrinterFromPath } from '$lib/printers';

	let { data }: PageProps = $props();

	let formPending = $state(false);
</script>

<Head title="Get printer" />

<h1 class="mt-5 mb-3 font-hero text-2xl font-medium">Get printer</h1>

<p class="mt-3">
	Are you sure you want to get "{getPrinterFromPath(data.user.printer.path).longName}" fulfilled?
	You'll enter the printer fulfilment queue and won't be able to upgrade from now on.
</p>
<form
	method="POST"
	class="mt-2 flex flex-row gap-2"
	use:enhance={() => {
		formPending = true;
		return async ({ update }) => {
			await update();
			formPending = false;
		};
	}}
>
	<a href={resolve('/dashboard/market/printer/')} class="button sm primary">Cancel</a>
	<button class="button sm dark-red" disabled={formPending}>
		Get printer
	</button>
</form>
