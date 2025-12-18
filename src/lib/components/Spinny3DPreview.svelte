<script lang="ts">
	import * as THREE from 'three';
	import { ThreeMFLoader, OrbitControls, OBJLoader, STLLoader } from 'three/examples/jsm/Addons.js';
	import { onDestroy, onMount } from 'svelte';
	import fileSizeFromUrl from '$lib/utils';

	let { identifier, modelUrl, lineColor = 0x94857d, sizeCutoff = 2.5 * 1024 * 1024 } = $props();

	let loadedPercent: number = $state(0);
	let showLoadButton: boolean = $state(false);
	let fileSize: number = $state(0);

	// Necessary for camera/plane rotation
	let degree = Math.PI / 180;

	// Create scene
	const scene = new THREE.Scene();

	let renderer: THREE.WebGLRenderer | null = null;
	let controls: OrbitControls | null = null;
	let camera: THREE.PerspectiveCamera | null = null;
	let animationId: number | null = null;
	let isVisible: boolean = false;
	let isModelLoaded: boolean = false;
	let containerElement: HTMLDivElement | null = null;
	let observer: IntersectionObserver | null = null;

	function loadModel() {
		if (!modelUrl) {
			return;
		}

		let canvas = document.querySelector(`#canvas-${identifier}`);

		if (!canvas) {
			return;
		}

		renderer = new THREE.WebGLRenderer({
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
		camera = new THREE.PerspectiveCamera(40, 2, 1, 1000);
		camera.rotation.x = -45 * degree;

		// Add controls, targetting the same DOM element
		controls = new OrbitControls(camera, renderer.domElement);
		controls.target.set(0, 0, 0);
		controls.rotateSpeed = 0.5;
		controls.dampingFactor = 0.1;
		controls.enableDamping = true;
		controls.autoRotate = false;
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
			const canvas = renderer?.domElement;
			const width = canvas?.clientWidth;
			const height = canvas?.clientHeight;
			if (canvas?.width !== width || canvas?.height !== height) {
				// you must pass false here or three.js sadly fights the browser
				renderer?.setSize(width ?? 0, height ?? 0, false);
				renderer?.setPixelRatio(window.devicePixelRatio);
				if (camera) camera.aspect = (width ?? 1) / (height ?? 1);
				camera?.updateProjectionMatrix();
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
					color: lineColor,
					linewidth: 1,
					polygonOffset: true,
					polygonOffsetFactor: -1,
					polygonOffsetUnits: -1
				})
			);

			lines.position.set(0, 0, 0);
			lines.rotation.x = THREE.MathUtils.degToRad(-90);
			lines.rotation.z = THREE.MathUtils.degToRad(-25);

			camera!.position.z = largestDimension * 1;
			camera!.position.y = largestDimension * 1;

			directional.position.set(largestDimension * 2, largestDimension * 2, largestDimension * 2);
			directional2.position.set(-largestDimension * 2, largestDimension * 2, -largestDimension * 2);

			scene.add(mesh);
			scene.add(lines);
		}

		// File extension
		let extension = modelUrl.slice(modelUrl.lastIndexOf('.'));

		function parseObject(object: THREE.Group<THREE.Object3DEventMap>) {
			object = object as THREE.Group<THREE.Object3DEventMap> & { children: THREE.Mesh[] };

			object.rotation.x = THREE.MathUtils.degToRad(-90);
			object.rotation.z = THREE.MathUtils.degToRad(-25);

			const aabb = new THREE.Box3().setFromObject(object);
			const center = aabb.getCenter(new THREE.Vector3());

			object.position.x += object.position.x - center.x;
			object.position.y += object.position.y - center.y;
			object.position.z += object.position.z - center.z;

			controls?.reset();

			var box = new THREE.Box3().setFromObject(object);
			const size = new THREE.Vector3();
			box.getSize(size);
			const largestDimension = Math.max(size.x, size.y, size.z);

			camera!.position.z = largestDimension * 1.3;
			camera!.position.y = largestDimension * 1;

			directional.position.set(largestDimension * 2, largestDimension * 2, largestDimension * 2);
			directional2.position.set(-largestDimension * 2, largestDimension * 2, -largestDimension * 2);

			camera!.near = largestDimension * 0.001;
			camera!.far = largestDimension * 100;
			camera?.updateProjectionMatrix();

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
						color: lineColor,
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
			modelUrl,
			(geoOrObject) =>
				geoOrObject instanceof THREE.BufferGeometry
					? parseGeometry(geoOrObject)
					: parseObject(geoOrObject),
			(xhr) => {
				// TODO: loading slider
				loadedPercent = (xhr.loaded / xhr.total) * 100;
				console.log(loadedPercent + '% loaded');
			},
			(error) => {
				console.log(error);
			}
		);

		const animate = function () {
			if (!isVisible) {
				animationId = null;
				return;
			}
			
			animationId = requestAnimationFrame(animate);
			
			if (controls && isVisible) {
				controls.autoRotate = true;
				controls.update();
			}
			
			renderer?.render(scene, camera!);
			resizeCanvasToDisplaySize();
		};
		
		isModelLoaded = true;
		if (isVisible) {
			animate();
		}
	}

	function startAnimation() {
		if (animationId === null && isModelLoaded && isVisible && renderer && controls && camera) {
			const animate = function () {
				if (!isVisible) {
					animationId = null;
					return;
				}
				
				animationId = requestAnimationFrame(animate);
				
				if (controls && isVisible) {
					controls.autoRotate = true;
					controls.update();
				}
				
				renderer?.render(scene, camera!);
				
				const canvas = renderer?.domElement;
				const width = canvas?.clientWidth;
				const height = canvas?.clientHeight;
				if (canvas?.width !== width || canvas?.height !== height) {
					renderer?.setSize(width ?? 0, height ?? 0, false);
					renderer?.setPixelRatio(window.devicePixelRatio);
					if (camera) camera.aspect = (width ?? 1) / (height ?? 1);
					camera?.updateProjectionMatrix();
				}
			};
			animate();
		}
	}

	function stopAnimation() {
		if (animationId !== null) {
			cancelAnimationFrame(animationId);
			animationId = null;
		}
		if (controls) {
			controls.autoRotate = false;
		}
	}

	onMount(() => {
		observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					const wasVisible = isVisible;
					isVisible = entry.isIntersecting;
					
					if (isVisible && !wasVisible && isModelLoaded) {
						startAnimation();
					} else if (!isVisible && wasVisible) {
						stopAnimation();
					}
				});
			},
			{
				threshold: 0.01,
				rootMargin: '50px'
			}
		);

		if (containerElement) {
			observer.observe(containerElement);
		}

		fileSizeFromUrl(modelUrl).then((size) => {
			fileSize = size;

			if (size <= sizeCutoff) {
				loadModel();
			} else {
				showLoadButton = true;
			}
		});
	});

	onDestroy(() => {
		stopAnimation();
		
		if (observer) {
			observer.disconnect();
			observer = null;
		}

		controls?.dispose();

		scene.traverse((obj) => {
			if ((obj as THREE.Mesh).geometry) {
				(obj as THREE.Mesh).geometry.dispose();
			}

			const material = (obj as THREE.Mesh).material;
			if (material) {
				if (Array.isArray(material)) {
					material.forEach((m) => m.dispose());
				} else {
					material.dispose();
				}
			}
		});

		scene.clear();

		renderer?.dispose();

		renderer = null;
		controls = null;
		camera = null;
		containerElement = null;
	});
</script>

<div class="relative h-full w-full" bind:this={containerElement}>
	{#if loadedPercent < 100}
		<div class="center flex">
			{#if showLoadButton}
				<button
					class="button md primary"
					onclick={() => {
						showLoadButton = false;
						loadModel();
					}}
				>
					Load ({Math.round((fileSize / 1024 / 1024) * 10) / 10} MiB)
				</button>
			{:else}
				<p>Loading... {Math.round(loadedPercent)}%</p>
			{/if}
		</div>
	{/if}
	<canvas class="h-full w-full" id={`canvas-${identifier}`}></canvas>
</div>
