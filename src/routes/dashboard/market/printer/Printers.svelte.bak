<script lang="ts">
	import { onMount } from 'svelte';
	import printerMap from '$lib/assets/printermap.png';
	import {
		getPrinterFromPath,
		getPurchaseablePrinters,
		printersSingleList,
		type Printer
	} from '$lib/printers';
	import { CircleDollarSign } from '@lucide/svelte';
	import { BASE_PRINTER_CLAY } from '$lib/defs';
	import { arraysEqual, calculateMarketPrice } from '$lib/utils';
	import { enhance } from '$app/forms';

	let frame: HTMLDivElement;
	let canvas: HTMLDivElement;

	let { data } = $props();

	let selectedPrinterPath: number[] | null = $state(null);
	let selectedPrinter: Printer | null = $derived(
		selectedPrinterPath !== null ? getPrinterFromPath(selectedPrinterPath) : null
	);
	let selectedPrinterPriceBricks = $derived(
		selectedPrinter
			? calculateMarketPrice(
					selectedPrinter.minBrick ?? 0,
					selectedPrinter.maxBrick ?? 0,
					selectedPrinter.minShopScore ?? 0,
					selectedPrinter.maxShopScore ?? 0,
					data.user.shopScore
				)
			: null
	);
	let canAffordPrinter = $derived(
		(selectedPrinter?.isBasePrinter && data.user.clay >= BASE_PRINTER_CLAY) ||
			(!selectedPrinter?.isBasePrinter && data.user.brick >= (selectedPrinterPriceBricks ?? 0))
	);

	let purchaseablePrinters: number[][] = $derived(getPurchaseablePrinters(data.user.printer.path));

	let selectedPrinterPurchaseable: boolean | null = $derived(
		selectedPrinterPath !== null
			? purchaseablePrinters.some(
					(arr) =>
						arr.length === selectedPrinterPath!.length &&
						arr.every((value, index) => value === selectedPrinterPath![index])
				)
			: null
	);
	let selectedPrinterAlreadyPurchased: boolean | null = $derived(
		selectedPrinterPath !== null
			? selectedPrinter?.singlePurchase &&
					data.purchasedPrinters.some(
						(arr: number[]) =>
							arr.length === selectedPrinterPath!.length &&
							arr.every((value, index) => value === selectedPrinterPath![index])
					)
			: null
	);

	let purchasePending: boolean = $state(false);

	const pos = $state({ x: 0, y: 0 });
	const target = $state({ x: 0, y: 0 });
	const drag = $state({
		active: false,
		startX: 0,
		startY: 0
	});

	const bounds = $state({
		minX: 0,
		minY: 0,
		maxX: 0,
		maxY: 0
	});

	let scale = $state(1);
	const baseCanvasWidth = 1600; // reference width the labels are designed for

	const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
	const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

	const smoothing = 0.15;
	let animationFrame: number;

	function animate() {
		pos.x = lerp(pos.x, target.x, smoothing);
		pos.y = lerp(pos.y, target.y, smoothing);

		if (Math.abs(pos.x - target.x) > 0.1 || Math.abs(pos.y - target.y) > 0.1) {
			animationFrame = requestAnimationFrame(animate);
		} else {
			pos.x = target.x;
			pos.y = target.y;
		}
	}

	function startAnimation() {
		cancelAnimationFrame(animationFrame);
		animationFrame = requestAnimationFrame(animate);
	}

	function recalcBounds() {
		if (!frame || !canvas) return;

		const frameRect = frame.getBoundingClientRect();
		const canvasRect = canvas.getBoundingClientRect();

		bounds.maxX = 0;
		bounds.maxY = 0;
		bounds.minX = frameRect.width - canvasRect.width;
		bounds.minY = frameRect.height - canvasRect.height;

		// Update scale based on actual canvas width vs reference width
		scale = canvasRect.width / baseCanvasWidth;

		// Clamp current position to new bounds
		target.x = clamp(target.x, bounds.minX, bounds.maxX);
		target.y = clamp(target.y, bounds.minY, bounds.maxY);
		pos.x = clamp(pos.x, bounds.minX, bounds.maxX);
		pos.y = clamp(pos.y, bounds.minY, bounds.maxY);
	}

	onMount(() => {
		recalcBounds();

		// Center on mount
		target.x = bounds.minX / 2;
		target.y = bounds.minY / 2;
		pos.x = target.x;
		pos.y = target.y;

		const resizeObserver = new ResizeObserver(() => {
			recalcBounds();
		});

		resizeObserver.observe(frame);

		return () => {
			cancelAnimationFrame(animationFrame);
			resizeObserver.disconnect();
		};
	});

	function onpointerdown(e: {
		clientX: number;
		clientY: number;
		currentTarget: { setPointerCapture: (arg0: any) => void };
		pointerId: any;
	}) {
		drag.active = true;
		drag.startX = e.clientX - target.x;
		drag.startY = e.clientY - target.y;
		e.currentTarget.setPointerCapture(e.pointerId);
	}

	function onpointermove(e: { clientX: number; clientY: number }) {
		if (!drag.active) return;

		target.x = clamp(e.clientX - drag.startX, bounds.minX, bounds.maxX);
		target.y = clamp(e.clientY - drag.startY, bounds.minY, bounds.maxY);
		startAnimation();
	}

	function onpointerup(e: {
		currentTarget: { releasePointerCapture: (arg0: any) => void };
		pointerId: any;
	}) {
		drag.active = false;
		e.currentTarget.releasePointerCapture(e.pointerId);
	}
</script>

<div
	bind:this={frame}
	class="relative mb-5 w-full grow overflow-hidden rounded-lg border-3 border-primary-900 bg-primary-950/60"
>
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="absolute z-2 h-full w-full bg-primary-950/50 transition-all"
		class:opacity-0={selectedPrinter == null}
		class:pointer-events-none={selectedPrinter == null}
		onclick={() => (selectedPrinter = null)}
	></div>

	<div
		class="pointer-events-none absolute flex h-full w-full flex-col justify-center"
		class:hidden={selectedPrinter == null}
	>
		<div class="flex flex-row justify-center">
			<div
				class="pointer-events-auto z-3 flex max-w-120 min-w-80 flex-col rounded-lg bg-primary-950 p-3 text-center outline-3 outline-primary-800 select-auto"
			>
				<h2 class="text-xl font-semibold">
					{selectedPrinter?.longName}
				</h2>
				<p>
					{selectedPrinter?.description}
				</p>
				<div class="mt-0.5 flex flex-row justify-center gap-1 align-middle text-primary-500">
					<CircleDollarSign size={22} />
					<p class="font-semibold">
						{#if selectedPrinter?.isBasePrinter}
							{BASE_PRINTER_CLAY} clay
						{:else}
							<span class="text-primary-400">
								{#if (selectedPrinterPriceBricks ?? 0) < (selectedPrinter?.maxBrick ?? 0)}
									<span class="text-primary-500 line-through">{selectedPrinter?.maxBrick}</span>
									{selectedPrinterPriceBricks} bricks
								{:else}
									{selectedPrinterPriceBricks} bricks
								{/if}
							</span>
						{/if}
					</p>
				</div>
				{#if !selectedPrinterPurchaseable && canAffordPrinter}
					{#if selectedPrinterAlreadyPurchased}
						<p class="mt-0.5 text-sm font-medium text-primary-600">Already purchased</p>
					{:else}
						<p class="mt-0.5 text-sm font-medium text-primary-600">
							Haven't bought required upgrades
						</p>
					{/if}
				{:else if canAffordPrinter}
					<p class="mt-0.5 text-xs opacity-50">
						Ships to your primary address on <a
							href="https://auth.hackclub.com/addresses"
							class="underline transition-colors hover:text-amber-500">Hack Club Auth</a
						>
					</p>
				{:else}
					<p class="mt-0.5 text-sm font-medium text-primary-600">Can't afford</p>
				{/if}

				<div class="mt-2 flex flex-row gap-3">
					<button class="button md primary flex-1" onclick={() => (selectedPrinter = null)}>
						Cancel
					</button>
					<form
						method="POST"
						class="flex-1"
						action="?/order"
						use:enhance={() => {
							purchasePending = true;
							return async ({ update }) => {
								await update({ reset: true });
								purchasePending = false;
								selectedPrinter = null;
							};
						}}
					>
						<input
							type="hidden"
							name="printerPath"
							value={JSON.stringify({ path: selectedPrinterPath })}
						/>
						<button
							class="button md orange w-full"
							type="submit"
							disabled={!selectedPrinterPurchaseable ||
								selectedPrinterAlreadyPurchased ||
								!canAffordPrinter}>Buy</button
						>
					</form>
				</div>
			</div>
		</div>
	</div>
	<div
		bind:this={canvas}
		{onpointerdown}
		{onpointermove}
		{onpointerup}
		class="absolute aspect-square w-[200%] cursor-grab select-none active:cursor-grabbing"
		style="transform: translate({pos.x}px, {pos.y}px);"
	>
		<img src={printerMap} alt="printer map" draggable="false" />
		<div class="absolute top-0 left-0 z-1 h-full w-full">
			<div class="relative h-full w-full">
				{#each printersSingleList as printer}
					{@const purchaseable = purchaseablePrinters.some(
						(arr) =>
							arr.length === printer.path.length &&
							arr.every((value, index) => value === printer.path[index])
					)}
					{@const current = arraysEqual(data.user.printer.path, printer.path)}
					<button
						class="absolute -translate-1/2 cursor-pointer rounded-xl border-3 border-primary-700 bg-primary-900 text-nowrap transition-opacity hover:opacity-100"
						class:outline-primary-500={purchaseable || current}
						class:opacity-90={purchaseable}
						class:outline-3={purchaseable}
						class:outline-4={current}
						class:opacity-95={current}
						style={`
							left: ${printer.x}%;
							top: ${printer.y}%;
							font-size: ${scale * 0.5654}rem;
							padding: ${scale * 0.418}rem;
						`}
						onclick={(e) => {
							e.stopPropagation();
							selectedPrinterPath = printer.path;
						}}
						onpointerdown={(e) => {
							e.stopPropagation();
							console.log(purchaseablePrinters, printer.path);
						}}
					>
						{printer.name}
					</button>
				{/each}
			</div>
		</div>
	</div>
</div>
