let forPrinters = $state(data.project.forPrinters ?? '');
<script lang="ts">
import { Lock, ExternalLink, Link, Download, Search, X } from '@lucide/svelte';
import relativeDate from 'tiny-relative-date';

	export let data: PageData;

	const { projects, s3PublicUrl } = data;

	// ── Filter definitions ──────────────────────────────────────────
	const FILTERS = [
		{ key: 'all',         label: 'All' },
		{ key: 'building',    label: 'Building' },
		{ key: 'submitted',   label: 'Submitted' },
		{ key: 't1_approved', label: 'Approved / Queue' },
		{ key: 'printing',    label: 'Being Printed' },
		{ key: 'printed',     label: 'Printed' },
		{ key: 'finalized',   label: 'Finalized' },
	] as const;

	type FilterKey = (typeof FILTERS)[number]['key'];

	// ── State ───────────────────────────────────────────────────────
	let searchQuery = '';
	let activeFilter: FilterKey = 'all';

	// ── Derived filtered list ───────────────────────────────────────
	$: filteredProjects = projects.filter((p) => {
		const matchesFilter = activeFilter === 'all' || p.status === activeFilter;
		const q = searchQuery.toLowerCase().trim();
		const matchesSearch =
			q === '' ||
			p.name.toLowerCase().includes(q) ||
			(p.description ?? '').toLowerCase().includes(q);
		return matchesFilter && matchesSearch;
	});

	// ── Helpers (kept from original page) ──────────────────────────
	const isLocked = (project: (typeof projects)[0]) =>
		['printed', 'finalized', 'printing', 'submitted', 't1_approved'].includes(project.status);

	function formatStatus(status: string) {
		return {
			building:    'Building',
			submitted:   'Submitted',
			t1_approved: 'On print queue',
			printing:    'Being printed',
			printed:     'Printed',
			finalized:   'Finalized',
		}[status] ?? status;
	}

	function formatTime(minutes: number | string) {
		const m = Number(minutes);
		const h = Math.floor(m / 60);
		const rem = m % 60;
		if (h === 0) return `${rem}min`;
		if (rem === 0) return `${h}h`;
		return `${h}h ${rem}min`;
	}
</script>

<div class="flex h-full flex-col">
	<!-- ── Header ──────────────────────────────────────────────────── -->
	<div class="flex justify-between items-center">
		<div>
			<h1 class="mt-5 mb-2 font-hero text-3xl font-medium">Projects</h1>
			<h2 class="text-md text-[#72685e] font-medium">
				{data.totalHours}h total ∙ {data.finalHours}h finalized
			</h2>
		</div>
		<a
			href="/dashboard/projects/create"
			class="offset block button md lg:inline-block text-center bg-primary-800 hover:ring-primary-50 hover:ring-2 hover:bg-primary-700 -mt-14"
		>
			Create project
		</a>
	</div>

	<!-- ── Search bar — uses themed-input from app.css ──────── -->
	<div class="relative mt-2 flex items-center">
		<Search size={15} class="pointer-events-none absolute left-3 text-primary-700" />
		<input
			type="text"
			bind:value={searchQuery}
			placeholder="Search projects..."
			autocomplete="off"
			spellcheck="false"
			class="themed-input w-full py-2.5 pl-9 pr-9 text-sm"
		/>
		{#if searchQuery}
			<button
				on:click={() => (searchQuery = '')}
				aria-label="Clear search"
				class="absolute right-2 flex items-center justify-center rounded-md p-1 text-primary-700 transition-colors hover:bg-primary-800 hover:text-primary-400"
			>
				<X size={13} />
			</button>
		{/if}
	</div>

	<!-- ── Filter chips — use themed-box style (dashed border) ──────── -->
	<div class="mt-3 flex flex-wrap gap-2">
		{#each FILTERS as filter (filter.key)}
			<button
				on:click={() => (activeFilter = filter.key)}
				class="
					rounded-lg border-2 px-2 py-1 text-xs font-semibold transition-colors
					{activeFilter === filter.key
						? 'border-primary-600 bg-primary-700 text-primary-50'
						: 'border-primary-900 bg-primary-950 text-primary-700 hover:border-primary-700 hover:bg-primary-900 hover:text-primary-400'}
				"
			>
				{filter.label}
			</button>
		{/each}
	</div>

	<!-- ── Count ─────────────────────────────────────────────────── -->
	<p class="mt-2 mb-0 text-sm text-[#72685e] font-medium">
		{filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
	</p>

	<!-- ── Project grid ──────────────────────────────────────────── -->
	{#if filteredProjects.length > 0}
		<div class="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-5 mt-2">
			{#each filteredProjects as project (project.id)}
				<div class="themed-box relative flex flex-col p-3 shadow-lg/20 transition-all hover:scale-102">
					<!-- Clickable overlay -->
					<a class="absolute inset-0 z-1" href="/dashboard/projects/{project.id}" aria-label="project"></a>

					<!-- Title + lock -->
					<h1 class="flex flex-row gap-1 text-xl font-semibold">
						<span class="grow truncate">{project.name}</span>
						{#if isLocked(project)}
							<span title="This project is currently locked as it has been shipped" class="relative z-2">
								<Lock size={24} />
							</span>
						{/if}
					</h1>

					<!-- Description -->
					<p class="mb-2 grow">{project.description ?? ''}</p>

					<!-- Links -->
					<div class="mb-2">
						<div class="flex flex-row gap-2">
							{#if project.url}
								<div class="flex">
									<a class="button sm primary relative z-2" href={project.url} target="_blank">
										<ExternalLink size={20} /> Printables page
									</a>
								</div>
							{/if}
							{#if project.editorFileType === 'upload' && project.uploadedFileUrl}
								<div class="flex">
									<a class="button sm primary relative z-2" href="{s3PublicUrl}/{project.uploadedFileUrl}" target="_blank">
										<Download size={20} /> Project file
									</a>
								</div>
							{:else if project.editorFileType === 'url' && project.editorUrl}
								<div class="flex">
									<a class="button sm primary relative z-2" href={project.editorUrl} target="_blank">
										<Link size={20} /> Project link
									</a>
								</div>
							{/if}
						</div>
					</div>

					<!-- Footer -->
					<div class="flex flex-row gap-4">
						<p class="grow text-sm">
							Created <abbr title={project.createdAt.toUTCString()} class="relative z-2">
    {relativeDate(project.createdAt)}
</abbr> ∙ {formatTime(project.timeSpent ?? 0)}
						</p>
						<p class="text-sm">{formatStatus(project.status)}</p>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<!-- Empty state -->
		<div class="themed-box mt-6 flex flex-col items-center justify-center gap-2 py-16 text-center">
			<Search size={28} class="text-primary-700" />
			<p class="font-semibold">No projects found</p>
			<p class="text-sm text-[#72685e]">
				{#if searchQuery && activeFilter !== 'all'}
					No <em>{activeFilter.replace('_', ' ')}</em> projects match "<em>{searchQuery}</em>"
				{:else if searchQuery}
					Nothing matches "<em>{searchQuery}</em>"
				{:else}
					No projects with status <em>{activeFilter.replace('_', ' ')}</em>
				{/if}
			</p>
			<button
				on:click={() => { searchQuery = ''; activeFilter = 'all'; }}
				class="button sm mt-2 bg-primary-800 hover:bg-primary-700"
			>
				Clear filters
			</button>
		</div>
	{/if}
</div>
