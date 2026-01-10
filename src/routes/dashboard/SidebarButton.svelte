<script lang="ts">
	import { page } from '$app/state';

	let { href, children, exact = false, icon = null, admin = false } = $props();

	let isExactMatch = $derived.by(
		() => page.url.pathname === href || page.url.pathname === href + '/'
	);
	let isCurrentPage = $derived.by(() =>
		exact ? isExactMatch : page.url.pathname.startsWith(href)
	);
</script>

<a
	href={isExactMatch ? null : href}
	class={`flex h-12 items-center justify-center gap-1.5 rounded-lg shadow-xl/3 transition-colors hover:outline-primary-100 2xl:h-13 ${
		admin
			? (isCurrentPage ? 'bg-primary-700' : 'bg-primary-800') +
				' border-2 border-dotted border-yellow-600 hover:bg-primary-700'
			: (isCurrentPage ? 'bg-primary-700' : 'bg-primary-800') + ' hover:bg-primary-700'
	} ${isExactMatch ? '' : 'hover:outline-2'}`}
>
	{#if icon}
		{@const Icon = icon}
		<div>
			<Icon />
		</div>
	{/if}
	<div>
		{@render children?.()}
	</div>
</a>
