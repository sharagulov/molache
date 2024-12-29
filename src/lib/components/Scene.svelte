<!--  
  Сцена (scene):
Создаётся один раз при onMount.
Хранит все объекты (модели, свет, камеры и т.д.).

  Камера (camera):
Настраивается один раз.
Хранится как переменная для последующего использования.

  HDRI-карта (hdrTexture):
Загружается с помощью EXRLoader.
Хранится в переменной hdrTexture для последующего освобождения ресурсов.

  Рендерер (renderer):
Получается через getRenderer().
Добавляется в DOM: mount.appendChild(renderer.domElement);

  EffectComposer и постобработка (composer):
Используются для добавления эффектов (например, свечения).
Хранятся в переменной composer.

  Модель (model):
Загружается с помощью GLTFLoader.
Добавляется в сцену и хранится в переменной model.
-->

<script>
	import { onMount, onDestroy } from 'svelte';
	import * as THREE from 'three';
	import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
	import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';
	import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
	import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
	import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
	import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
	import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
	import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

	import { getRenderer, disposeRenderer } from '../renderer.js';

	import Scroller from '../components/Scroller.svelte';
	import html2canvas from 'html2canvas';

	let mountWebGL;

	let hdrTexture;
	let composer;

	let model;
	let scene;
	let camera;
	let animationId;

	let scrollerContainer;
	let scrollerTexture;
	let scrollerMesh;

	let targetRotation = 0;
	let currentRotation = 0;

	const BLOOM_SCENE = 1;
	const bloomLayer = new THREE.Layers();
	bloomLayer.set(BLOOM_SCENE);
	const darkMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
	const materials = {};

	function restoreMaterial(obj) {
		if (materials[obj.uuid]) {
			console.log('Restoring material for:', obj.uuid, materials[obj.uuid]);
			obj.material = materials[obj.uuid];
			delete materials[obj.uuid];
		}
	}

	function nonBloomed(obj) {
		if (obj.isMesh && bloomLayer.test(obj.layers) === false) {
			materials[obj.uuid] = obj.material;
			obj.material = darkMaterial;
		}
	}

	function lerp(a, b, t) {
		return a + (b - a) * t;
	}

	onMount(() => {
		scene = new THREE.Scene();
		camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000);
		camera.position.set(0, 0, 50);
		camera.lookAt(0, 0, 0);

		const hdrLoader = new EXRLoader();
		hdrLoader.load('/models/studio_small_09_4k.exr', (texture) => {
			hdrTexture = texture;
			hdrTexture.mapping = THREE.EquirectangularReflectionMapping;
			scene.environment = hdrTexture;
			scene.background = new THREE.Color(0xffffff);
		});

		const renderer = getRenderer();
		mountWebGL.appendChild(renderer.domElement);

		const renderScene = new RenderPass(scene, camera);

		const bloomPass = new UnrealBloomPass(
			new THREE.Vector2(window.innerWidth, window.innerHeight),
			0.3,
			0.1,
			0.1
		);

		const bloomComposer = new EffectComposer(renderer);
		bloomComposer.renderToScreen = false;
		bloomComposer.addPass(renderScene);
		bloomComposer.addPass(bloomPass);

		const mixPass = new ShaderPass(
			new THREE.ShaderMaterial({
				uniforms: {
					baseTexture: { value: null },
					bloomTexture: { value: bloomComposer.renderTarget2.texture }
				},
				vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }
    `,
				fragmentShader: `
        uniform sampler2D baseTexture;
        uniform sampler2D bloomTexture;
        varying vec2 vUv;
        void main() {
            gl_FragColor = ( texture2D( baseTexture, vUv ) + texture2D( bloomTexture, vUv ) );
        }
    `,
				defines: {}
			}),
			'baseTexture'
		);
		mixPass.needsSwap = true;

		const outputPass = new OutputPass();

		const finalComposer = new EffectComposer(renderer);
		finalComposer.addPass(renderScene);
		finalComposer.addPass(mixPass);
		finalComposer.addPass(outputPass);

		const loader = new GLTFLoader();
		loader.load('/models/ring2.glb', (gltf) => {
			model = gltf.scene;
			model.traverse((child) => {
				if (child.isMesh) {
					child.castShadow = true;
					child.receiveShadow = true;
					child.layers.enable(BLOOM_SCENE);
				}
			});
			scene.add(model);
			model.position.set(0, 0, 0);
			model.rotation.z -= 3;
			model.scale.set(6, 6, 6);
		});

		if (scrollerContainer) {
			html2canvas(scrollerContainer, {
				scale: 2,
				ignoreElements: (el) => el.tagName === 'CANVAS',
				useCORS: true,
				backgroundColor: 0xffffff
			}).then((canvas) => {
				scrollerTexture = new THREE.CanvasTexture(canvas);
				scrollerTexture.minFilter = THREE.LinearFilter;
				scrollerTexture.magFilter = THREE.LinearFilter;

				const planeGeometry = new THREE.PlaneGeometry(10, 40);
				const planeMaterial = new THREE.MeshBasicMaterial({
					map: scrollerTexture,
					side: THREE.DoubleSide,
					transparent: true
				});
				scrollerMesh = new THREE.Mesh(planeGeometry, planeMaterial);
				console.log('scrollerMesh AT GENESIS =', scrollerMesh.material.uuid);
				scene.add(scrollerMesh);
			});
		}

		let lastTime = 0;
		const fps = 100;
		const frameInterval = 1000 / fps;

		function animate(time) {
			animationId = requestAnimationFrame(animate);
			if (time - lastTime > frameInterval) {
				lastTime = time;
				currentRotation = lerp(currentRotation, targetRotation, 0.1);
				if (model) {
					model.rotation.x = currentRotation;
          model.position.z = currentRotation;
				}
				if (scrollerMesh) {
					scrollerMesh.position.y = currentRotation;
				}

				//console.log("BLTEST:", model.name, bloomLayer.test(model.layers), "2");
				console.log(
					'Before replacing material, scrollerMesh material =',
					scrollerMesh.material.uuid
				);

        scene.background = new THREE.Color(0x000000);
				scene.traverse(nonBloomed);
				bloomComposer.render();
				scene.traverse(restoreMaterial);
        scene.background = new THREE.Color(0xffffff);

				// render the entire scene, then render bloom scene on top
				finalComposer.render();
			}
		}
		animate();

		const handleScroll = () => {
			const scrollTop = window.scrollY || window.pageYOffset;
			targetRotation = scrollTop * 0.003;
			clearTimeout(handleScroll._timeout);
			handleScroll._timeout = setTimeout(() => {
				updateScrollerTexture();
			}, 300);
		};

		window.addEventListener('scroll', handleScroll);

		const onResize = () => {
			camera.aspect = window.innerWidth / window.innerHeight;
			camera.updateProjectionMatrix();
			renderer.setSize(window.innerWidth, window.innerHeight);
			fxaaPass.material.uniforms['resolution'].value.x =
				1 / (window.innerWidth * renderer.getPixelRatio());
			fxaaPass.material.uniforms['resolution'].value.y =
				1 / (window.innerHeight * renderer.getPixelRatio());
			updateScrollerTexture();
		};

		window.addEventListener('resize', onResize);

		onDestroy(() => {
			window.removeEventListener('scroll', handleScroll);
			window.removeEventListener('resize', onResize);
			if (animationId) {
				cancelAnimationFrame(animationId);
			}
			if (model) {
				model.traverse((child) => {
					if (child.isMesh) {
						child.geometry.dispose();
						if (child.material) {
							if (Array.isArray(child.material)) {
								child.material.forEach((m) => m.dispose());
							} else {
								child.material.dispose();
							}
						}
					}
				});
				scene.remove(model);
				model = null;
			}
			if (hdrTexture) {
				hdrTexture.dispose();
				hdrTexture = null;
			}
			if (composerBloom) {
				composerBloom.dispose();
				composerBloom = null;
			}
			if (composerFinal) {
				composerFinal.dispose();
				composerFinal = null;
			}
			if (scrollerMesh) {
				scrollerMesh.geometry.dispose();
				scrollerMesh.material.dispose();
				scene.remove(scrollerMesh);
				scrollerMesh = null;
			}
			disposeRenderer();
		});
	});
</script>

<div>
	<div bind:this={mountWebGL}></div>
	<!-- Контейнер для scroller -->
	<div
		style="width: fit-content; height: fit-content; border-radius: 60px; background-color: transparent"
		bind:this={scrollerContainer}
	>
		<Scroller />
	</div>
</div>

<style>
	:global(body) {
		margin: 0;
	}
	div {
		box-sizing: border-box;
	}
</style>
