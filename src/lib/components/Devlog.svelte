<script lang="ts">
	// https://github.com/3daddict/stl-viewer/ and https://tonybox.net/posts/simple-stl-viewer/ for stl viewer code

	import relativeDate from 'tiny-relative-date';
	import { SquarePen, Trash } from '@lucide/svelte';
	import * as THREE from 'three';
	import { OBJLoader, STLLoader, ThreeMFLoader } from 'three/examples/jsm/Addons.js';
	import { OrbitControls } from 'three/examples/jsm/Addons.js';
	import { onMount } from 'svelte';
	import { page } from '$app/state';

	let { devlog, projectId, showModifyButtons, allowDelete = true, projectName = null, user = null } = $props();

	// Necessary for camera/plane rotation
	let degree = Math.PI / 180;

	// Create scene
	const scene = new THREE.Scene();

	onMount(() => {
		if (!devlog.model) {
			return;
		}

		let canvas = document.querySelector(`#canvas-${devlog.id}`);

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
		// to set it every frame anyway so we'l`${page.data.s3PublicUrl}/${devlog.image}`l set it to 2 since 2
		// is the the aspect for the canvas default size (300w/150h = 2)
		const camera = new THREE.PerspectiveCamera(40, 2, 1, 1000);
		camera.rotation.x = -45 * degree;

		// Add controls, targetting the same DOM element
		let controls = new OrbitControls(camera, renderer.domElement);
		controls.target.set(0, 0, 0);
		controls.rotateSpeed = 0.5;
		controls.dampingFactor = 0.1;
		controls.enableDamping = true;
		controls.autoRotate = true;
		controls.autoRotateSpeed = 4;
		controls.update();

		// Lighting
		const hemisphere = new THREE.HemisphereLight(0xffffff, 0xffffff, 1.6);
		scene.add(hemisphere);

		const directional = new THREE.DirectionalLight(0xffffff, 2);
		directional.castShadow = true;
		directional.shadow.mapSize.width = 2048;
		directional.shadow.mapSize.height = 2048;
		scene.add(directional);

		const directional2 = new THREE.DirectionalLight(0xffffff, 2);
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

		var meshMaterial = new THREE.MeshStandardMaterial({
			transparent: true,
			opacity: 0.9,
			color: 0xc2b0a0,
			roughness: 0.5,
			flatShading: false,
			side: THREE.DoubleSide
		});

		// Geometry parser (for .stl)
		function parseGeometry(
			geometry: THREE.BufferGeometry<THREE.NormalBufferAttributes, THREE.BufferGeometryEventMap>
		) {
			geometry.computeVertexNormals();

			const mesh = new THREE.Mesh(geometry, meshMaterial);

			mesh.name = 'loadedMeshObject';
			mesh.castShadow = true;
			mesh.receiveShadow = true;

			mesh.position.set(0, 0, 0);

			// Centre the mesh
			var middle = new THREE.Vector3();
			geometry.computeBoundingBox();

			var largestDimension = 1;

			if (geometry.boundingBox) {
				geometry.boundingBox.getCenter(middle);

				largestDimension = Math.max(
					geometry.boundingBox.max.x,
					geometry.boundingBox.max.y,
					geometry.boundingBox.max.z
				);
			}

			mesh.geometry.applyMatrix4(
				new THREE.Matrix4().makeTranslation(-middle.x, -middle.y, -middle.z)
			);

			mesh.rotation.x = THREE.MathUtils.degToRad(-90);
			mesh.rotation.z = THREE.MathUtils.degToRad(-25);

			const edges = new THREE.EdgesGeometry(geometry);
			const lines = new THREE.LineSegments(
				edges,
				new THREE.LineBasicMaterial({
					color: 0x94857d,
					linewidth: 1,
					polygonOffset: true,
					polygonOffsetFactor: -1,
					polygonOffsetUnits: -1
				})
			);

			lines.position.set(0, 0, 0);
			lines.rotation.x = THREE.MathUtils.degToRad(-90);
			lines.rotation.z = THREE.MathUtils.degToRad(-25);

			camera.position.z = largestDimension * 1;
			camera.position.y = largestDimension * 1;

			directional.position.set(largestDimension * 2, largestDimension * 2, largestDimension * 2);
			directional2.position.set(-largestDimension * 2, largestDimension * 2, -largestDimension * 2);

			scene.add(mesh);
			scene.add(lines);
		}

		// File extension
		let extension = devlog.model.slice(devlog.model.lastIndexOf('.'));

		function parseObject(object: THREE.Group<THREE.Object3DEventMap>) {
			object = object as THREE.Group<THREE.Object3DEventMap> & { children: THREE.Mesh[] };

			object.rotation.x = THREE.MathUtils.degToRad(-90);
			object.rotation.z = THREE.MathUtils.degToRad(-25);

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

			camera.position.z = largestDimension * 1.3;
			camera.position.y = largestDimension * 1;

			directional.position.set(largestDimension * 2, largestDimension * 2, largestDimension * 2);
			directional2.position.set(-largestDimension * 2, largestDimension * 2, -largestDimension * 2);

			camera.near = largestDimension * 0.001;
			camera.far = largestDimension * 100;
			camera.updateProjectionMatrix();

			const edgeLines: { lines: THREE.LineSegments; mesh: THREE.Mesh }[] = [];

			object.traverse(function (child) {
				child.castShadow = true;
				child.receiveShadow = true;

				const mesh = child as THREE.Mesh;

				// only 3MF can do colours, obj can't do that
				if (extension === '.3mf') {
					const material = mesh.material;

					if (Array.isArray(material)) {
						material.forEach((mat) => {
							mat.transparent = true;
							mat.side = THREE.DoubleSide;
							mat.opacity = 0.9;
							mat.needsUpdate = true;
						});
					} else if (material instanceof THREE.Material) {
						material.transparent = true;
						material.side = THREE.DoubleSide;
						material.opacity = 0.9;
						material.needsUpdate = true;
					}
				} else {
					if (Array.isArray(mesh.material)) {
						mesh.material = meshMaterial;
					} else if (mesh.material instanceof THREE.Material) {
						mesh.material = meshMaterial;
					}
				}

				const edges = new THREE.EdgesGeometry(mesh.geometry);
				const lines = new THREE.LineSegments(
					edges,
					new THREE.LineBasicMaterial({
						color: 0x94857d,
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

		var loader;

		switch (extension) {
			case '.stl':
				loader = new STLLoader();
				break;
			case '.obj':
				loader = new OBJLoader();
				break;
			case '.3mf':
				loader = new ThreeMFLoader();
				break;
			default:
				return;
		}

		loader.load(
			page.data.s3PublicUrl + '/' + devlog.model,
			(geoOrObject) =>
				geoOrObject instanceof THREE.BufferGeometry
					? parseGeometry(geoOrObject)
					: parseObject(geoOrObject),
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

<div
	class="themed-box relative flex flex-col p-3 shadow-lg/20 transition-all"
	id={`devlog-${devlog.id}`}
>
	<p class="mb-0.5 text-sm opacity-90">
		{#if user}
			<a href={`/dashboard/users/${user.id}#devlog-${devlog.id}`} class="truncate underline"
				>{user.name}</a
			> ∙
		{/if}
		{#if projectName}
			<a href={`/dashboard/projects/${projectId}#devlog-${devlog.id}`} class="truncate underline"
				>{projectName}</a
			> ∙
		{/if}
		<abbr title={`${devlog.createdAt.toUTCString()}`}>
			{relativeDate(devlog.createdAt)}
		</abbr>
		∙ {devlog.timeSpent} minutes
	</p>
	<p>
		{devlog.description}
	</p>
	<div class="my-1 flex flex-col gap-3 lg:flex-row">
		<!-- svelte-ignore a11y_img_redundant_alt -->
		<div
			class={`flex max-h-100 w-full grow flex-row justify-center border-3 border-primary-900 ${devlog.model ? 'lg:max-w-[55%]' : ''}`}
		>
			<div class="flex justify-center">
				<img
					src={`${page.data.s3PublicUrl}/${devlog.image}`}
					alt="Journal image"
					class="max-h-full max-w-full object-contain"
				/>
			</div>
		</div>
		{#if devlog.model}
			<div class="max-h-100 w-full lg:w-100 grow border-3 border-primary-900 lg:max-w-[60%]">
				<canvas class="h-full w-full" id={`canvas-${devlog.id}`}></canvas>
			</div>
		{/if}
	</div>
	{#if showModifyButtons}
		<div class="mt-1 flex flex-row gap-1">
			<a
				href={`/dashboard/projects/${projectId}/devlog/${devlog.id}/edit`}
				class="button xs primary"
			>
				<SquarePen />
				Edit
			</a>
			<a
				href={allowDelete ? `/dashboard/projects/${projectId}/devlog/${devlog.id}/delete` : null}
				class={`button xs dark-red ${allowDelete ? '' : 'disabled'}`}
				title={allowDelete ? null : 'Currently locked as the project has been shipped'}
			>
				<Trash />
				Delete
			</a>
		</div>
	{/if}
</div>
