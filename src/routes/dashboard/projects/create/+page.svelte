<script lang="ts">
	import { enhance } from '$app/forms';
	import Head from '$lib/components/Head.svelte';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();

	let formPending = $state(false);
</script>

<Head title="Create project" />

<h1 class="mt-5 mb-3 font-hero text-2xl font-medium">Create project</h1>

<div class="themed-box mb-4 p-3">
	<h2 class="text-xl font-bold text-primary-300 underline">
		Read this before you start your project!
	</h2>
	<p class="my-1">Sorry it's a bit long, but it's really important!</p>
	<p class="my-1">Here's how the shipping process works:</p>
	<ol class="list-inside list-decimal">
		<li>You finish your project, upload it to Printables and ship it.</li>
		<li>
			We will review your project to make sure everything looks fine and is printable. We will also
			check if there are any makes or photos of it on Printables. This can be done in a few ways:
			<ul class="list-inside list-disc indent-5">
				<li>Someone on Printables thinks your design is cool, prints it and posts a make of it!</li>
				<li>
					You print it yourself and put pictures of it on Printables (though obviously you can only
					do this if you already have a printer).
				</li>
				<li>
					It doesn't have any pictures or makes when we review your ship. In this case, your design
					is printed by someone on our printer team and they add a make of it on Printables. To help
					cover the filament cost, we will take a small cut of your payout, though we will be
					subsidising some of the cost ourselves.
					<strong
						><span class="underline"
							>For this reason we recommend you do fewer, longer projects.</span
						>
						Your project should be ~6-10h, or even longer if you want.</strong
					>
				</li>
			</ul>
		</li>
		<li>It gets approved once more and you'll get your clay/bricks!</li>
	</ol>
	<p class="mt-2 mb-1">
		Make sure you design your project to be 3D printable! Avoid overhangs if you can and reduce the
		places where you'd need supports. During the design process you should always keep how it will
		be printed in mind and avoid wasting filament. You also can't use any electronics or other
		hardware such as bearings, except nuts and bolts in standard metric and imperial sizes (don't go
		above M6 or 1/4" though).
	</p>
	<p class="my-1">
		Aim to do journal every 30 mins to 1 hour, frequent and higher quality journal logs will earn
		you a higher market score!
	</p>
	<h3 class="text-lg font-bold">Market score? what's that??</h3>
	<p class="my-1">
		Market score is our system of encouraging you to make better projects! In the second review
		stage, we decide how much market score you'll gain from your project. Here's what your market
		score depends on:
	</p>
	<ul class="my-1 list-inside list-disc">
		<li>How cool we think your project is!</li>
		<li>The number and quality of your devlogs</li>
		<li>How polished your project is</li>
	</ul>
	<p class="my-1">
		A higher market score:
	</p>
	<ul class="my-1 list-inside list-disc">
		<li>Reduces the price of market items</li>
		<li>Lets you unlock more items in the market</li>
		<li>Gives you a cool profile badge!</li>
		<li>Maybe lets you access a secret market 👀?</li>
	</ul>
	<a href="https://hackclub.enterprise.slack.com/docs/T0266FRGM/F09Q2DS061J" class="underline"
		>Check the FAQ for more info!</a
	>
</div>

<form
	method="POST"
	class="flex flex-col gap-3 mb-5"
	use:enhance={() => {
		formPending = true;
		return async ({ update }) => {
			await update();
			formPending = false;
		};
	}}
>
	<div>
		<label class="flex flex-col gap-1">
			Project name
			<input
				type="text"
				name="name"
				placeholder="Come up with an interesting name"
				required
				value={form?.fields?.name ?? ''}
				class="themed-box ring-primary-900 placeholder:text-primary-900 active:ring-3"
			/>
		</label>
		{#if form?.invalid_name}
			<p class="text-sm">Invalid name, must be between 1 and 80 characters</p>
		{/if}
	</div>
	<div>
		<label class="flex flex-col gap-1">
			<span>Description <span class="inline opacity-50">(optional)</span></span>
			<textarea
				name="description"
				placeholder="A couple sentences to describe your project"
				class="themed-box ring-primary-900 placeholder:text-primary-900 active:ring-3"
				>{form?.fields?.description ?? ''}</textarea
			>
		</label>
		{#if form?.invalid_description}
			<p class="text-sm">Invalid description, must be at most 1000 characters</p>
		{/if}
	</div>
	<button type="submit" class="button md primary mt-3 shadow-lg" disabled={formPending}>
		Create!
	</button>
</form>
