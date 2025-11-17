<script lang="ts">
	let {
		text,
		bgcolor = 'bg-amber-600',
		bgcolor_hover = 'bg-amber-500',
		ringcolor = 'ring-amber-50',
		disabled = false,
		...other
	} = $props();
</script>

<a
	{...other}
	class="offset block button md lg:inline-block {bgcolor} {disabled
		? 'cursor-not-allowed'
		: `hover:${ringcolor} hover:ring-2 hover:${bgcolor_hover}`} {other.class ? other.class : ''}"
>
	{text}
</a>
