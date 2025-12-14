<script lang="ts">
	let { idvDomain } = $props();
</script>

<div class="mt-20 flex flex-col items-center justify-center px-10">
	<h1 class="mb-3 text-center text-3xl font-bold sm:text-4xl">Rules</h1>
	<div class="mt-2 flex w-full max-w-2xl flex-col gap-4 lg:flex-row">
		<div class="flex-1">
			<h3 class="mb-1 text-lg font-semibold">Eligibility</h3>
			<ul class="list-inside list-disc text-sm">
				<li>You must be 13-18 years old.</li>
				<li>You cannot be banned from Hackatime.</li>
				<li>
					You must be part of the <a
						href="https://hackclub.com/slack/"
						class="underline"
					>
						Hack Club Slack community
					</a>.
				</li>
				<li>
					You must have verified your identity at our <a
						href={`https://${idvDomain}`}
						class="underline"
					>
						identity platform
					</a>.
				</li>
			</ul>
		</div>
		<div class="flex-1">
			<h3 class="mb-1 text-lg font-semibold">Project requirements</h3>
			<ul class="list-inside list-disc text-sm">
				<li>You should spend at least 2 hours on each individual project.</li>
				<li>
					You should use one of our <a href="/approved-editors" class="underline">approved editors</a>.
				</li>
				<li>
					You should track your time with the journaling feature.
				</li>
				<li>
					You should upload your project to Printables once done.
				</li>
			</ul>
		</div>
	</div>
</div>