<script lang="ts">
	import DataCard from '$lib/components/DataCard.svelte';
	import Head from '$lib/components/Head.svelte';
	import { formatMinutes, projectStatuses } from '$lib/utils.js';
	import {
		CircleDollarSign,
		Clock,
		PencilRuler,
		User,
		GitFork,
		ShieldCheck,
		Printer,
		Shield,
		Building2,
		Store,
		TrendingUp
	} from '@lucide/svelte';
	import { onMount, onDestroy } from 'svelte';
	import {
		Chart,
		BarController,
		BarElement,
		LineController,
		LineElement,
		PointElement,
		LinearScale,
		CategoryScale,
		Title,
		Tooltip,
		Filler
	} from 'chart.js';

	Chart.register(BarController, BarElement, LineController, LineElement, PointElement, LinearScale, CategoryScale, Title, Tooltip, Filler);

	let { data } = $props();

	const funnelStages = [
		{ label: 'Registered', key: 'totalUsers' },
		{ label: 'Created a project', key: 'withProject' },
		{ label: 'Submitted', key: 'submitted' },
		{ label: 'T1 Approved', key: 't1Approved' },
		{ label: 'Printed', key: 'printed' },
		{ label: 'Finalized', key: 'finalized' },
		{ label: '10 Hours Finalised', key: 'hours10' },
		{ label: '25 Hours Finalised', key: 'hours25' },
		{ label: '40 Hours Finalised', key: 'hours40' },
		{ label: 'Bought a printer', key: 'boughtPrinter' },
		{ label: 'Requested printer', key: 'requestedPrinter' },
		{ label: 'Printer fulfilled', key: 'printerFulfilled' },
	] as const;
	const chartColors = {
		users: '#338eda',
		projects: '#fe6c11',
		submissions: '#c064e8',
		devlogs: '#0dbc8e',
	};

	const trustColors: Record<string, string> = {
		green: 'bg-hc-green-500',
		blue: 'bg-hc-blue-500',
		yellow: 'bg-hc-yellow-500',
		red: 'bg-hc-red-500'
	};

	const trustLabels: Record<string, string> = {
		green: 'Green',
		blue: 'Blue',
		yellow: 'Yellow',
		red: 'Red'
	};

	const printerStatusLabels: Record<string, string> = {
		none: 'None',
		queued: 'Queued',
		approved: 'Approved',
		fulfilled: 'Fulfilled'
	};

	const orderStatusLabels: Record<string, string> = {
		awaiting_approval: 'Awaiting',
		fulfilled: 'Fulfilled',
		denied: 'Denied',
		refunded: 'Refunded'
	};

	let funnelChartEl = $state<HTMLCanvasElement | null>(null);
	let usersChartEl = $state<HTMLCanvasElement | null>(null);
	let projectsChartEl = $state<HTMLCanvasElement | null>(null);
	let submissionsChartEl = $state<HTMLCanvasElement | null>(null);
	let devlogChartEl = $state<HTMLCanvasElement | null>(null);

	let charts: Chart[] = [];

	function formatWeek(iso: string): string {
		const d = new Date(iso);
		const month = d.toLocaleDateString('en-US', { month: 'short' });
		const day = d.getDate();
		return `${month} ${day}`;
	}

	function makeLineChart(
		el: HTMLCanvasElement | null,
		labels: string[],
		values: number[],
		label: string,
		color: string,
	) {
		if (!el) return;
		const ctx = el.getContext('2d');
		if (!ctx) return;
		const chart = new Chart(ctx, {
			type: 'line',
			data: {
				labels,
				datasets: [{
					label,
					data: values,
					borderColor: color,
					backgroundColor: color + '33',
					fill: true,
					tension: 0.3,
					pointRadius: 3,
					pointHoverRadius: 5,
				}]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: { display: false },
					tooltip: {
						backgroundColor: '#22211f',
						titleColor: '#f3dcc6',
						bodyColor: '#f3dcc6',
						cornerRadius: 8,
						padding: 10,
					}
				},
				scales: {
					x: {
						ticks: { color: '#94857d', maxTicksLimit: 8, font: { size: 10 } },
						grid: { color: '#342f2c' },
					},
					y: {
						beginAtZero: true,
						ticks: { color: '#94857d', font: { size: 10 } },
						grid: { color: '#342f2c' },
					}
				},
				interaction: {
					intersect: false,
					mode: 'index',
				}
			}
		});
		charts.push(chart);
	}

	function initFunnelChart() {
		if (!funnelChartEl) return;
		const ctx = funnelChartEl.getContext('2d');
		if (!ctx) return;

		const labels = funnelStages.map(s => s.label);
		const values = funnelStages.map(s => data.funnel[s.key] as number);
		const total = data.funnel.totalUsers;
		const maxVal = Math.max(...values);

		const stageColors = funnelStages.map((_, i) => {
			if (i < 6) return '#f89708';
			if (i < 9) return '#0dbc8e';
			return '#338eda';
		});

		const offsetData = values.map(v => (maxVal - v) / 2);

		const chart = new Chart(ctx, {
			type: 'bar',
			data: {
				labels,
				datasets: [
					{
						data: offsetData,
						backgroundColor: 'transparent',
						hoverBackgroundColor: 'transparent',
					},
					{
						data: values,
						backgroundColor: stageColors,
						borderRadius: 2,
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: { display: false },
					tooltip: {
						backgroundColor: '#22211f',
						titleColor: '#f3dcc6',
						bodyColor: '#f3dcc6',
						cornerRadius: 8,
						padding: 10,
						callbacks: {
							label: (ctx) => {
								if (ctx.datasetIndex === 0) return;
								const val = ctx.parsed.y ?? 0;
								const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0.0';
								return `${val} (${pct}%)`;
							}
						}
					}
				},
				scales: {
					x: {
						stacked: true,
						ticks: {
							color: '#94857d',
							font: { size: 10 },
							maxRotation: 45,
						},
						grid: { display: false },
					},
					y: {
						stacked: true,
						beginAtZero: true,
						display: false,
					}
				},
				interaction: {
					intersect: false,
					mode: 'index',
				}
			}
		});
		charts.push(chart);
	}

	function initCharts() {
		initFunnelChart();
		const months = data.usersOverTime.map((d: { month: string }) => formatWeek(d.month));
		makeLineChart(usersChartEl, months, data.usersOverTime.map((d: { count: number }) => d.count), 'New users', chartColors.users);
		makeLineChart(projectsChartEl, months, data.projectsOverTime.map((d: { count: number }) => d.count), 'Projects created', chartColors.projects);
		makeLineChart(submissionsChartEl, months, data.submissionsOverTime.map((d: { count: number }) => d.count), 'Submissions', chartColors.submissions);
		makeLineChart(devlogChartEl, months, data.devlogHoursOverTime.map((d: { hours: number }) => d.hours), 'Hours logged', chartColors.devlogs);
	}

	onMount(() => {
		initCharts();
	});

	onDestroy(() => {
		charts.forEach(c => c.destroy());
	});
</script>

<Head title="Stats" />

<div class="flex h-full flex-col">
	<h1 class="mt-5 mb-3 font-hero text-3xl font-medium">Stats</h1>

	<div class="flex flex-col gap-5">
		<!-- Users -->
		<div class="flex flex-col gap-1">
			<h2 class="flex flex-row gap-2 text-2xl font-bold"><User size={28} />Users</h2>
			<div class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
				<DataCard title="Total"><code>{data.users.count}</code></DataCard>
				<DataCard title="With projects"><code>{data.usersWithProjects.total}</code></DataCard>
				<DataCard title="With shipped projects"><code>{data.usersWithProjects.shipped}</code></DataCard>
			</div>
		</div>

		<!-- User Funnel -->
		<div class="flex flex-col gap-1">
			<h2 class="flex flex-row gap-2 text-2xl font-bold"><GitFork size={28} />User Funnel</h2>
			<div class="themed-box p-4 shadow-xl">
				<div style="height: 480px;">
					<canvas bind:this={funnelChartEl}></canvas>
				</div>
			</div>
		</div>

		<!-- Trends -->
		<div class="flex flex-col gap-1">
			<h2 class="flex flex-row gap-2 text-2xl font-bold"><TrendingUp size={28} />Monthly Trends</h2>
			<div class="grid grid-cols-1 gap-3 lg:grid-cols-2">
				<div class="themed-box p-3 shadow-xl">
					<p class="mb-1 text-sm font-semibold opacity-60">New Users</p>
					<div style="height: 180px;"><canvas bind:this={usersChartEl}></canvas></div>
				</div>
				<div class="themed-box p-3 shadow-xl">
					<p class="mb-1 text-sm font-semibold opacity-60">Projects Created</p>
					<div style="height: 180px;"><canvas bind:this={projectsChartEl}></canvas></div>
				</div>
				<div class="themed-box p-3 shadow-xl">
					<p class="mb-1 text-sm font-semibold opacity-60">Submissions</p>
					<div style="height: 180px;"><canvas bind:this={submissionsChartEl}></canvas></div>
				</div>
				<div class="themed-box p-3 shadow-xl">
					<p class="mb-1 text-sm font-semibold opacity-60">Devlog Hours</p>
					<div style="height: 180px;"><canvas bind:this={devlogChartEl}></canvas></div>
				</div>
			</div>
		</div>

		<!-- Projects -->
		<div class="flex flex-col gap-1">
			<h2 class="flex flex-row gap-2 text-2xl font-bold"><PencilRuler size={28} />Projects</h2>
			<div class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
				<DataCard title="Total"><code>{data.project.count}</code></DataCard>
				<DataCard title="Devlog count"><code>{data.devlogs.count}</code></DataCard>
				<DataCard title="Shipped projects"><code>{data.shippedStats.count}</code></DataCard>
				<DataCard title="Shipped devlogs"><code>{data.shippedStats.totalDevlogs}</code></DataCard>
				<DataCard title="Devlogs per project"><code>{Math.round(data.shippedStats.averageDevlogs * 100) / 100}</code></DataCard>
			</div>
			<h3 class="mt-1 text-xl font-semibold">By status</h3>
			<div class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
				<DataCard title={projectStatuses.building}><code>{data.project.building}</code></DataCard>
				<DataCard title={projectStatuses.submitted}><code>{data.project.submitted}</code></DataCard>
				<DataCard title={projectStatuses.t1_approved}><code>{data.project.t1_approved}</code></DataCard>
				<DataCard title={projectStatuses.printing}><code>{data.project.printing}</code></DataCard>
				<DataCard title={projectStatuses.printed}><code>{data.project.printed}</code></DataCard>
				<DataCard title={projectStatuses.t2_approved}><code>{data.project.t2_approved}</code></DataCard>
				<DataCard title={projectStatuses.finalized}><code>{data.project.finalized}</code></DataCard>
				<DataCard title={projectStatuses.rejected}><code>{data.project.rejected}</code></DataCard>
				<DataCard title={projectStatuses.rejected_locked}><code>{data.project.rejected_locked}</code></DataCard>
			</div>
		</div>

		<!-- Time -->
		<div class="flex flex-col gap-1">
			<h2 class="flex flex-row gap-2 text-2xl font-bold"><Clock size={28} />Time</h2>
			<div class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
				<DataCard title="Total">{formatMinutes(data.devlogs.totalTime)}</DataCard>
				<DataCard title="Total (shipped)">{formatMinutes(data.shippedStats.totalTimeSpent)}</DataCard>
				<DataCard title="Average shipped time">{formatMinutes(data.shippedStats.averageTimeSpent)}</DataCard>
				<DataCard title="Average devlog time">{formatMinutes(data.devlogs.timePerDevlog)}</DataCard>
			</div>
		</div>

		<!-- Review Pipeline -->
		<div class="flex flex-col gap-1">
			<h2 class="flex flex-row gap-2 text-2xl font-bold"><ShieldCheck size={28} />Review Pipeline</h2>

			<h3 class="text-xl font-semibold">T1 Review</h3>
			<div class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
				<DataCard title="Total reviews"><code>{data.t1Stats.total}</code></DataCard>
				<DataCard title="Approved"><code>{data.t1Stats.approve}</code></DataCard>
				<DataCard title="Approved (no print)"><code>{data.t1Stats.approveNoPrint}</code></DataCard>
				<DataCard title="Rejected"><code>{data.t1Stats.reject}</code></DataCard>
				<DataCard title="Rejected (locked)"><code>{data.t1Stats.rejectLock}</code></DataCard>
				<DataCard title="Comments"><code>{data.t1Stats.addComment}</code></DataCard>
				<DataCard title="Unique reviewers"><code>{data.t1Stats.uniqueReviewers}</code></DataCard>
				<DataCard title="Awaiting review"><code>{data.awaitingT1}</code></DataCard>
			</div>

			<h3 class="mt-1 text-xl font-semibold">Legion (Print)</h3>
			<div class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
				<DataCard title="Total actions"><code>{data.legionStats.total}</code></DataCard>
				<DataCard title="Marked for printing"><code>{data.legionStats.markForPrinting}</code></DataCard>
				<DataCard title="Printed"><code>{data.legionStats.print}</code></DataCard>
				<DataCard title="Rejected"><code>{data.legionStats.reject}</code></DataCard>
				<DataCard title="Already printed"><code>{data.legionStats.alreadyPrinted}</code></DataCard>
				<DataCard title="Comments"><code>{data.legionStats.addComment}</code></DataCard>
				<DataCard title="Unique reviewers"><code>{data.legionStats.uniqueReviewers}</code></DataCard>
				<DataCard title="Filament used"><code>{Number(data.legionStats.totalFilament).toFixed(1)}g</code></DataCard>
				<DataCard title="Awaiting print"><code>{data.awaitingPrint}</code></DataCard>
			</div>

			<h3 class="mt-1 text-xl font-semibold">T2 Review</h3>
			<div class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
				<DataCard title="Total reviews"><code>{data.t2Stats.total}</code></DataCard>
				<DataCard title="Unique reviewers"><code>{data.t2Stats.uniqueReviewers}</code></DataCard>
				<DataCard title="Avg score multiplier"><code>{Number(data.t2Stats.avgMultiplier).toFixed(1)}x</code></DataCard>
				<DataCard title="Awaiting T2"><code>{data.awaitingT2}</code></DataCard>
			</div>
		</div>

		<!-- Printer Ecosystem -->
		<div class="flex flex-col gap-1">
			<h2 class="flex flex-row gap-2 text-2xl font-bold"><Printer size={28} />Printer Ecosystem</h2>
			<div class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
				<DataCard title="Has base printer"><code>{data.basePrinterStats.hasBase}</code></DataCard>
				<DataCard title="No base printer"><code>{data.basePrinterStats.noBase}</code></DataCard>
				<DataCard title="Printer orders"><code>{data.printerOrderCount}</code></DataCard>
				<DataCard title="Projects printed"><code>{data.printedProjectCount}</code></DataCard>
			</div>
			<h3 class="mt-1 text-xl font-semibold">Fulfilment status</h3>
			<div class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
				{#each data.printerFulfilment as entry}
					<DataCard title={printerStatusLabels[entry.status] ?? entry.status}>
						<code>{entry.count}</code>
					</DataCard>
				{/each}
			</div>
		</div>

		<!-- Trust Distribution -->
		<div class="flex flex-col gap-1">
			<h2 class="flex flex-row gap-2 text-2xl font-bold"><Shield size={28} />Trust Distribution</h2>
			<div class="themed-box p-4 shadow-xl">
				<div class="flex flex-col gap-2">
					{#each data.trustDistribution as entry}
						{@const pct = data.users.count > 0 ? ((entry.count / data.users.count) * 100).toFixed(1) : '0.0'}
						<div class="flex flex-col gap-0.5">
							<div class="flex justify-between text-sm">
								<span class="font-medium capitalize">{trustLabels[entry.trust] ?? entry.trust}</span>
								<span class="opacity-60">{entry.count} ({pct}%)</span>
							</div>
							<div class="h-5 w-full rounded bg-white/10">
								<div
									class="h-full rounded {trustColors[entry.trust] ?? 'bg-gray-500'} transition-all"
									style="width: {pct}%"
								></div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>

		<!-- Club Stats -->
		<div class="flex flex-col gap-1">
			<h2 class="flex flex-row gap-2 text-2xl font-bold"><Building2 size={28} />Clubs</h2>
			<div class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
				<DataCard title="Total clubs"><code>{data.clubStats.totalClubs}</code></DataCard>
				<DataCard title="Total memberships"><code>{data.membershipStats.totalMemberships}</code></DataCard>
				<DataCard title="Avg members per club">
					<code>{data.clubStats.totalClubs > 0 ? Number(data.membershipStats.totalMemberships / data.clubStats.totalClubs).toFixed(1) : '0'}</code>
				</DataCard>
			</div>
		</div>

		<!-- Currency -->
		<div class="flex flex-col gap-1">
			<h2 class="flex flex-row gap-2 text-2xl font-bold"><CircleDollarSign size={28} />Currency</h2>
			<h3 class="text-xl font-semibold">Total</h3>
			<div class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
				<DataCard title="Clay"><code>{data.users.total.clay}</code></DataCard>
				<DataCard title="Bricks"><code>{data.users.total.brick}</code></DataCard>
				<DataCard title="Market score"><code>{data.users.total.shopScore}</code></DataCard>
			</div>
			<h3 class="mt-1 text-xl font-semibold">Average</h3>
			<div class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
				<DataCard title="Clay"><code>{Math.round(data.users.average.clay * 100) / 100}</code></DataCard>
				<DataCard title="Bricks"><code>{Math.round(data.users.average.brick * 100) / 100}</code></DataCard>
				<DataCard title="Market score"><code>{Math.round(data.users.average.shopScore * 100) / 100}</code></DataCard>
			</div>
			<h3 class="mt-1 text-xl font-semibold">Ovenpheus</h3>
			<div class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
				<DataCard title="Conversions"><code>{data.ovenpheusStats.totalConversions}</code></DataCard>
				<DataCard title="Clay converted"><code>{Number(data.ovenpheusStats.totalClay).toFixed(1)}</code></DataCard>
				<DataCard title="Bricks received"><code>{Number(data.ovenpheusStats.totalBricks).toFixed(1)}</code></DataCard>
			</div>
		</div>

		<!-- Market -->
		<div class="flex flex-col gap-1">
			<h2 class="flex flex-row gap-2 text-2xl font-bold"><Store size={28} />Market</h2>
			<h3 class="text-xl font-semibold">Items</h3>
			<div class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
				<DataCard title="Total items"><code>{data.marketItemStats.total}</code></DataCard>
				<DataCard title="Public"><code>{data.marketItemStats.public}</code></DataCard>
				<DataCard title="Private"><code>{data.marketItemStats.private}</code></DataCard>
			</div>
			<h3 class="mt-1 text-xl font-semibold">Orders</h3>
			<div class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
				{#each data.orderStatusBreakdown as entry}
					<DataCard title={orderStatusLabels[entry.status] ?? entry.status}>
						<code>{entry.count}</code>
					</DataCard>
				{/each}
			</div>
		</div>
	</div>
</div>
