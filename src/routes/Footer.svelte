<script lang="ts">
	import { env } from '$env/dynamic/public';
</script>

<footer class="flex w-full flex-col items-center justify-center px-10 pt-5 pb-3 md:mt-8 lg:mt-8">
	<div class="">
		<p class="text-center">
			A <a href="https://hackclub.com" class="underline">Hack Club</a> program. Made by teens, for
			teens!
			{#if env.PUBLIC_COMMIT}
				· Build <a href={`https://github.com/hackclub/construct/commit/${env.PUBLIC_COMMIT}`} class="underline">{env.PUBLIC_COMMIT.slice(0, 7)}</a>
			{/if}
		</p>
	</div>
</footer>
