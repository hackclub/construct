<script lang="ts">
	let {
		text,
		bgcolor = 'bg-primary-600',
		bgcolor_hover = 'bg-primary-500',
		ringcolor = 'ring-primary-50',
		disabled = false,
		...other
	} = $props();
</script>

<a
	{...other}
	class="offset button md block text-center lg:inline-block {bgcolor} {disabled
		? 'cursor-not-allowed'
		: `hover:${ringcolor} hover:ring-2 hover:${bgcolor_hover}`} {other.class ? other.class : ''}"
>
	{text}
</a>
