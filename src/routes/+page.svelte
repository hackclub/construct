<script lang="ts">
	import OrpheusFlag from '../lib/components/OrpheusFlag.svelte';

	import Button from '$lib/components/Button.svelte';
	import Accordion from '$lib/components/Accordion.svelte';
	import Rules from './Rules.svelte';
	import Shop from './Shop.svelte';
	import Footer from './Footer.svelte';

	import model from '$lib/assets/Construct Logo.3mf?url';
	import modelImage from '$lib/assets/model.png';
	import keyringModel from '$lib/assets/keyring.3mf?url';
	import sticker1Image from '$lib/assets/sticker1.png';
	import sticker2Image from '$lib/assets/sticker2.png';

	let { data } = $props();

	import * as THREE from 'three';
	import { ThreeMFLoader, OrbitControls } from 'three/examples/jsm/Addons.js';
	import { onMount } from 'svelte';
	import Head from '$lib/components/Head.svelte';
	import Spinny3DPreview from '$lib/components/Spinny3DPreview.svelte';

	let degree = Math.PI / 180;
	let showStickersSection = $state(false);
	let keyringInitialized = false;

	const scene = new THREE.Scene();

	onMount(() => {
		if (!model) {
			return;
		}

		let canvas = document.querySelector(`#canvas`);

		if (!canvas) {
			return;
		}

		const renderer = new THREE.WebGLRenderer({
			canvas,
			antialias: true,
			alpha: true
		});

		renderer.setClearColor(0xffffff, 0);
		renderer.setPixelRatio(window.devicePixelRatio);

		renderer.shadowMap.enabled = true;
		renderer.shadowMap.type = THREE.PCFSoftShadowMap;

		// There's no reason to set the aspect here because we're going
		// to set it every frame anyway so we'll set it to 2 since 2
		// is the the aspect for the canvas default size (300w/150h = 2)
		const camera = new THREE.PerspectiveCamera(40, 2, 1, 1000);
		camera.rotation.x = -45 * degree;

		// Add controls, targetting the same DOM element
		let controls = new OrbitControls(camera, renderer.domElement);
		controls.target.set(0, 0, 0);
		controls.rotateSpeed = 0.6;
		controls.enablePan = false;
		controls.dampingFactor = 0.1;
		controls.enableDamping = true;
		controls.autoRotate = false;
		controls.autoRotateSpeed = 2;
		controls.update();

		// Lighting
		const hemisphere = new THREE.HemisphereLight(0xffffff, 0xffffff, 4);
		scene.add(hemisphere);

		const directional = new THREE.DirectionalLight(0xffffff, 1);
		directional.castShadow = true;
		directional.shadow.mapSize.width = 2048;
		directional.shadow.mapSize.height = 2048;
		scene.add(directional);

		const directional2 = new THREE.DirectionalLight(0xffffff, 1);
		directional2.castShadow = true;
		directional2.shadow.mapSize.width = 2048;
		directional2.shadow.mapSize.height = 2048;
		scene.add(directional2);

		function resizeCanvasToDisplaySize() {
			const canvas = renderer.domElement;
			const width = canvas.clientWidth;
			const height = canvas.clientHeight;
			if (canvas.width !== width || canvas.height !== height) {
				// you must pass false here or three.js sadly fights the browser
				renderer.setSize(width, height, false);
				renderer.setPixelRatio(window.devicePixelRatio);
				camera.aspect = width / height;
				camera.updateProjectionMatrix();
			}
		}

		// var meshMaterial = new THREE.MeshStandardMaterial({
		// 	transparent: true,
		// 	opacity: 1,
		// 	color: 0xb2a090,
		// 	roughness: 0.5,
		// 	flatShading: false,
		// 	side: THREE.DoubleSide
		// });

		function parseObject(object: THREE.Group<THREE.Object3DEventMap>) {
			object = object as THREE.Group<THREE.Object3DEventMap> & { children: THREE.Mesh[] };

			object.rotation.x = THREE.MathUtils.degToRad(-90);
			// object.rotation.z = THREE.MathUtils.degToRad(-25);

			const aabb = new THREE.Box3().setFromObject(object);
			const center = aabb.getCenter(new THREE.Vector3());

			object.position.x += object.position.x - center.x;
			object.position.y += object.position.y - center.y;
			object.position.z += object.position.z - center.z;

			controls.reset();

			var box = new THREE.Box3().setFromObject(object);
			const size = new THREE.Vector3();
			box.getSize(size);
			const largestDimension = Math.max(size.x, size.y, size.z);

			camera.position.z = largestDimension * 0.3;
			camera.position.y = largestDimension * 1.38;

			directional.position.set(largestDimension * 2, largestDimension * 2, largestDimension * 2);
			directional2.position.set(-largestDimension * 2, largestDimension * 2, -largestDimension * 2);

			camera.near = largestDimension * 0.001;
			camera.far = largestDimension * 10;
			camera.updateProjectionMatrix();

			const edgeLines: { lines: THREE.LineSegments; mesh: THREE.Mesh }[] = [];

			object.traverse(function (child) {
				child.castShadow = true;
				child.receiveShadow = true;

				const mesh = child as THREE.Mesh;

				// const material = mesh.material;

				// if (Array.isArray(material)) {
				// 	material.forEach((mat) => {
				// 		mat.transparent = true;
				// 		mat.side = THREE.DoubleSide;
				// 		mat.opacity = 0.9;
				// 		mat.needsUpdate = true;
				// 	});
				// } else if (material instanceof THREE.Material) {
				// 	material.transparent = true;
				// 	material.side = THREE.DoubleSide;
				// 	material.opacity = 0.9;
				// 	material.needsUpdate = true;
				// }

				// if (Array.isArray(mesh.material)) {
				// 	mesh.material = meshMaterial;
				// } else if (mesh.material instanceof THREE.Material) {
				// 	mesh.material = meshMaterial;
				// }

				const edges = new THREE.EdgesGeometry(mesh.geometry);
				const lines = new THREE.LineSegments(
					edges,
					new THREE.LineBasicMaterial({
						color: 0xf3dcc6,
						linewidth: 1,
						polygonOffset: true,
						polygonOffsetFactor: -1,
						polygonOffsetUnits: -1
					})
				);

				lines.position.copy(mesh.position);
				lines.rotation.copy(mesh.rotation);

				edgeLines.push({ lines, mesh });
			});

			// Have to do it this way to avoid infinite recursion
			edgeLines.forEach(({ lines, mesh }) => {
				mesh.add(lines);
			});

			scene.add(object);
		}

		var loader = new ThreeMFLoader();

		loader.load(
			model,
			parseObject,
			(xhr) => {
				// TODO: loading slider
				console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
			},
			(error) => {
				console.log(error);
			}
		);

		const animate = function () {
			requestAnimationFrame(animate);
			controls.update();
			renderer.render(scene, camera);
			resizeCanvasToDisplaySize();
		};
		animate();
	});
</script>

<Head title="" />

{#if !showStickersSection}
	<button
		class="button md primary absolute top-4 right-4 z-50 animate-[bounce_2s_infinite]"
		onclick={() => {
			keyringInitialized = false;
			showStickersSection = !showStickersSection;
		}}
	>
		Free stickers + keyring!
	</button>
{/if}

{#if showStickersSection}
	<div
		class="fixed inset-0 z-1000 flex items-center justify-center bg-black/70 p-4"
		role="dialog"
		aria-modal="true"
		tabindex="0"
		onclick={(e) => {
			if (e.target === e.currentTarget) {
				showStickersSection = false;
			}
		}}
		onkeydown={(e) => e.key === 'Escape' && (showStickersSection = false)}
	>
		<div
			class="relative max-h-[95vh] w-full max-w-5xl overflow-y-auto rounded-lg border-3 border-primary-900 bg-primary-950 p-8 shadow-2xl"
			role="document"
			tabindex="-1"
		>
			<button
				class="button md primary absolute top-4 right-4 z-10"
				onclick={() => (showStickersSection = false)}
				aria-label="Close dialog"
			>
				Close
			</button>

			<div class="mx-auto max-w-4xl">
				<div class="mb-8 text-center">
					<h2 class="mb-2 text-2xl font-bold sm:text-3xl">Free swag with your first submission</h2>
					<p class="text-lg font-medium text-primary-300">
						Ship a project, get exclusive Construct goodies
					</p>
				</div>

				<div class="grid gap-6 sm:grid-cols-2">
					<div class="themed-box p-6">
						<div
							class="mb-4 flex h-56 items-center justify-center gap-3 overflow-hidden rounded-lg border-2 border-primary-900 bg-primary-900"
						>
							<img
								src={sticker1Image}
								alt="Construct sticker 1"
								class="h-40 w-40 animate-[spin_20s_linear_infinite] object-contain"
								style="animation-direction: normal;"
							/>
							<img
								src={sticker2Image}
								alt="Construct sticker 2"
								class="h-40 w-40 animate-[spin_20s_linear_infinite] object-contain"
								style="animation-direction: reverse;"
							/>
						</div>
						<div class="text-center">
							<h3 class="mb-2 text-xl font-bold">Sticker Pack</h3>
							<p class="text-sm text-primary-300">yay stickers!!!</p>
						</div>
					</div>

					<div class="themed-box p-6">
						<div
							class="mb-4 flex h-56 items-center justify-center overflow-hidden rounded-lg border-2 border-primary-900 bg-primary-900"
						>
							<Spinny3DPreview
								identifier="keyring"
								modelUrl={keyringModel}
								sizeCutoff={8 * 1024 * 1024}
								respectLocalStorage={false}
							/>
						</div>
						<div class="text-center">
							<h3 class="mb-2 text-xl font-bold">Construct Keyring</h3>
							<p class="text-sm text-primary-300">
								even more yay keyring
								<img
									src="https://emoji.slack-edge.com/T09V59WQY1E/yayayayayay/203666b7424ee7a7.gif"
									alt="yay"
									class="inline h-6"
								/>
							</p>
						</div>
					</div>
				</div>

				<div class="themed-box mt-6 p-6 text-center">
					<p class="font-medium">Ship your first project and we'll mail these to you!</p>
				</div>
			</div>
		</div>
	</div>
{/if}

<OrpheusFlag />

<div class="flex w-full flex-col items-center justify-center px-10 lg:flex-row">
	<div class="mt-30">
		<div class="relative z-1 flex flex-row">
			<a
				class="mb-1 flex h-7 shrink flex-row items-center gap-2 pr-2 transition-opacity hover:opacity-50"
				href="https://hackclub.com"
			>
				<img src="https://assets.hackclub.com/icon-rounded.svg" alt="Hack Club logo" class="h-7" />
				<p class="text-lg font-semibold">
					<span class="font-bold text-hc-red-500">Hack Club</span> presents...
				</p>
			</a>
		</div>
		<div class="hidden sm:block">
			<div
				class="group z-0 flex flex-col overflow-clip transition-all hover:h-130 sm:h-25 sm:w-150 md:h-30 md:w-160 lg:h-35 lg:w-200"
			>
				<canvas
					class="h-200 w-full transition-transform sm:translate-y-[-255px] sm:group-hover:-translate-y-15 md:translate-y-[-255px] md:group-hover:-translate-y-15 lg:translate-y-[-330px] lg:group-hover:-translate-y-35"
					width="200"
					height="200"
					id={`canvas`}
				></canvas>
			</div>
			<p class="relative z-1 mt-2 w-full animate-pulse text-center text-sm">interact with me!</p>
		</div>
		<img src={modelImage} alt="construct model logo" class="mt-3 mb-6 sm:hidden" />
		<div class="relative z-1 w-full text-center">
			<p class="my-3 text-xl font-medium">Spend 40 hours doing CAD projects, get a 3D printer!</p>
			{#if data.loggedIn}
				<Button text="Go to dashboard" href="/dashboard" />
			{:else}
				<Button text="Login with Hack Club" href="/auth/idv" />
			{/if}
			<p class="text-md my-3">Ages 13-18, ending February 15th!</p>
		</div>
	</div>
</div>

<div class="mt-24 flex flex-col items-center justify-center px-10">
	<h1 class="mb-3 text-center text-3xl font-bold sm:text-4xl">What is this?</h1>
	<div class="w-full max-w-2xl">
		<p class="mt-3 max-w-2xl">
			<strong>Want a 3D printer?</strong> Spend 40 hours doing CAD projects, get a free 3D printer of
			your choice!
		</p>
	</div>
</div>

<!-- <Shop /> -->

<Rules idvDomain={data.idvDomain} />

<div class="mt-20 flex flex-col items-center justify-center px-10">
	<h1 class="mb-3 text-center text-2xl font-bold sm:text-4xl">Frequently asked questions</h1>
	<div class="w-full max-w-2xl">
		<Accordion text="Is this free?">
			<p>
				Yes! This program is entirely funded by <a href="https://hackclub.com" class="underline">
					Hack Club
				</a>, a US-based 501(c)(3) charity helping teens learn how to design and code, with sponsors
				such as <a href="https://github.com" class="underline">GitHub</a>.
			</p>
		</Accordion>
		<Accordion text="What can I make?">
			<p>
				Any reasonable CAD project is fine, get creative! However, you must use one of the <a
					href="/approved-editors"
					class="underline">approved editors</a
				>.
			</p>
		</Accordion>
		<Accordion text="What are the requirements to get a 3D printer?">
			<p>You must ship at least 40 hours' worth of projects by the end of the event.</p>
		</Accordion>
		<Accordion text="What are the requirements to participate?">
			<p>
				You must be between the ages 13-18 and have verified your identity on our <a
					href={`https://${data.idvDomain}`}
					class="underline"
				>
					identity platform
				</a>.
			</p>
		</Accordion>
	</div>
</div>

<div class="mt-15 mb-30 flex flex-col items-center justify-center gap-5 px-10">
	<h1 class="text-center text-3xl font-bold sm:text-4xl">Ready?</h1>
	<div class="w-full max-w-2xl text-center">
		{#if data.loggedIn}
			<Button text="Go to dashboard" href="/dashboard" />
		{:else}
			<Button text="Login with Hack Club" href="/auth/idv" />
		{/if}
	</div>
</div>

<Footer />
