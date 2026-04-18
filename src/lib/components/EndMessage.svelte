<script>
	import { END_DATE } from "$lib/defs";
	import relativeDate from "tiny-relative-date";
</script>

<div
	class="mt-3 mb-3 flex flex-col gap-0.5 rounded-lg border-3 border-primary-700 bg-primary-900 p-3"
>
	{#if END_DATE > new Date()}
		<h2 class="text-xl font-bold text-primary-400">It's almost the end!</h2>
		<p>
			Construct will be ending <abbr
				title={`${END_DATE.toLocaleDateString()} ${END_DATE.toLocaleTimeString()}`}
				class="font-bold"
			>
				{relativeDate(END_DATE)}
			</abbr>, at 00:00 EST on April 20th ({END_DATE.toLocaleDateString()}
			{END_DATE.toLocaleTimeString()} in your timezone)
		</p>
		<p>
			The market will stay open and you'll still be able to re-ship rejected projects, however you
			won't be able to ship new projects.
		</p>
		<p class="mt-1"><strong>Note:</strong> Clubs' projects will not be impacted.</p>
	{:else}
		<h2 class="text-xl font-bold text-primary-400">Construct has ended!</h2>
		<p>
			Construct has ended <abbr
				title={`${END_DATE.toLocaleDateString()} ${END_DATE.toLocaleTimeString()}`}
			>
				{relativeDate(END_DATE)}
			</abbr>.
		</p>
		<p>
			The market is still open and you can still re-ship rejected projects, however you can't ship
			new projects.
		</p>
		<p class="mt-1"><strong>Note:</strong> Clubs' projects are not impacted.</p>
	{/if}
</div>
