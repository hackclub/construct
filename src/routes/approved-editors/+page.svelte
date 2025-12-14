<script>
	import Head from '$lib/components/Head.svelte';
	import OrpheusFlag from '$lib/components/OrpheusFlag.svelte';
	import { ArrowLeft } from '@lucide/svelte';
</script>

<Head title="Approved editors" />

<OrpheusFlag />

<div class="mt-24 flex flex-col items-center justify-center px-10">
	<a href="/" class="mb-5 flex flex-row gap-1 underline transition-all hover:gap-3"
		><ArrowLeft /> Back</a
	>
	<h1 class="mb-3 text-center text-3xl font-bold sm:text-4xl">Approved editors</h1>
	<p class="mb-1 max-w-2xl">Here's the list of CAD software you can use:</p>
	<ul class="list-inside list-disc">
		<li>Fusion 360</li>
		<li>Onshape</li>
		<li>Shapr3D</li>
		<li class="group relative">
			Solidworks <img
				src="https://emoji.slack-edge.com/T0266FRGM/thinkies/12dbe989643f6f35.png"
				alt="thinkies"
				class="absolute ml-1 inline h-6 whitespace-nowrap opacity-0 transition-all group-hover:opacity-50"
			/>
		</li>
		<li class="group relative">
			FreeCAD <span
				class="absolute ml-1 inline w-full whitespace-nowrap opacity-0 transition-all group-hover:opacity-50"
			>
				(idk why you'd want to but go for it)
			</span>
		</li>
		<li class="group relative">
			OpenSCAD <span
				class="absolute ml-1 inline w-full whitespace-nowrap opacity-0 transition-all group-hover:opacity-50"
			>
				!!
			</span>
		</li>
		<li>Blender</li>
	</ul>
	<p class="mt-2">No TinkerCAD please.</p>
	<p class="mt-1">
		Want to get something else added here? Ask in <a
			href="https://hackclub.slack.com/archives/C09QSTUV88Y"
			class="underline" target="_blank">#construct-help</a
		>!
	</p>
</div>
