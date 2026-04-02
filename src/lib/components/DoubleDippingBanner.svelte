<script lang="ts">
	let { ysws, reviewMessage = false } = $props();
</script>

{#if ysws === 'enclosure'}
	<div class="p-3 enclosure-bg rounded-lg shadow-xl">
		<p class="font-medium">
            Also submitted to <a href="https://enclosure.hackclub.com" class="underline hover:opacity-70 transition-opacity">Enclosure</a>!
        </p>
        {#if reviewMessage}
            <p class="font-bold">
                Don't review/print this project unless you're an Enclosure org/reviewer
            </p>
        {/if}
	</div>
{/if}
