<script lang="ts">
	import { page } from '$app/state';
</script>

<div
	class="mt-40 flex w-full flex-col items-center justify-center gap-1 px-10 text-center md:mt-24 lg:mt-16"
>
	<p>oh no!!!</p>
	<h1 class="font-hero text-2xl">Error {page.status}</h1>
	<p class="text-lg font-medium">{page.error?.message}</p>
	<img
		src={`https://http.cat/images/${page.status}.jpg`}
		class="mt-2"
		alt={`error ${page.status}`}
	/>
	<a href="/dashboard" class="mt-10 underline">Go back home</a>
</div>
