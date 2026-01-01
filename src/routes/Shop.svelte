<script lang="ts">
	import prize01 from '$lib/assets/prizes/rocket01.jpg';
	import prize02 from '$lib/assets/prizes/rocket02.jpg';
	import prize03 from '$lib/assets/prizes/rocket03.jpg';

	import ImageCard from '$lib/components/ImageCard.svelte';
</script>

<div class="mt-16 flex flex-col items-center justify-center px-10">
	<h1 class="mb-5 text-center text-3xl font-bold sm:text-4xl">Shop</h1>
	<p>Here are the 3D printers you can get!</p>
	<div class="mt-5 flex flex-col gap-4 md:flex-row">
		<ImageCard
			title="Soyuz-FG"
			text="Your typical Soviet rocket but it's pretty small ∙ 10 hours"
			imgsrc={prize01}
		/>
		<ImageCard
			title="Falcon Heavy"
			text="Cool rocket but there are better ones ∙ 15 hours"
			imgsrc={prize02}
		/>
		<ImageCard title="Saturn V" text="The moon rocket™ ∙ 20 hours" imgsrc={prize03} />
	</div>
	<p class="pt-5 text-sm">...and more!</p>
</div>
