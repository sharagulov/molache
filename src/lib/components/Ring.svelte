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
Добавляется в сцену и хранится в переменной model. -->

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

	// Импортируем функции для работы с рендерером
	import { getRenderer, disposeRenderer } from '../renderer.js';

	let mount;
	let animationId;
	let composer;
	let hdrTexture;
	let model;
	let scene;
	let camera;

	let targetRotation = 0;
	let currentRotation = 0;

	onMount(() => {
		scene = new THREE.Scene();

		camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000);
		camera.position.z = 50;

		function lerp(a, b, t) {
			return a + (b - a) * t;
		}

		const hdrLoader = new EXRLoader();
		hdrLoader.load('/models/studio_small_09_4k.exr', (texture) => {
			hdrTexture = texture;
			hdrTexture.mapping = THREE.EquirectangularReflectionMapping;
			scene.environment = hdrTexture;
			//scene.background = hdrTexture;
			scene.background = new THREE.Color(0xaaaaaa); // Белый фон
		});

		const renderer = getRenderer();
		mount.appendChild(renderer.domElement);

		composer = new EffectComposer(renderer);
		const renderPass = new RenderPass(scene, camera);
		composer.addPass(renderPass);

		const fxaaPass = new ShaderPass(FXAAShader);
		const pixelRatio = renderer.getPixelRatio();
		fxaaPass.material.uniforms['resolution'].value.x = 1 / (window.innerWidth * pixelRatio);
		fxaaPass.material.uniforms['resolution'].value.y = 1 / (window.innerHeight * pixelRatio);
		composer.addPass(fxaaPass);

		composer.addPass(fxaaPass);

		const bloomPass = new UnrealBloomPass(
			new THREE.Vector2(window.innerWidth, window.innerHeight),
			0.22, // интенсити
			0.2, // радиус
			0.1 // порог
		);
		composer.addPass(bloomPass);

		const loader = new GLTFLoader();
		loader.load('/models/ring2.glb', (gltf) => {
			model = gltf.scene;
			model.traverse((child) => {
				if (child.isMesh) {
					child.castShadow = true;
					child.receiveShadow = true;
				}
			});
			scene.add(model);
			model.scale.set(5, 5, 5);
			model.rotation.z += 3;
		});

		let lastTime = 0;
		const fps = 180;
		const frameInterval = 1000 / fps;

		function animate(time) {
			animationId = requestAnimationFrame(animate);
			if (time - lastTime > frameInterval) {
				lastTime = time;
				currentRotation = lerp(currentRotation, targetRotation, 0.1);
				///////////////console.log(lerp(currentRotation, targetRotation, 0.1));
				if (model) {
					model.rotation.x = currentRotation;
					/////////////////////console.log(currentRotation);
				}
				composer.render();
			}
		}
		animate();

		const handleScroll = () => {
			const scrollTop = window.scrollY || window.pageYOffset;
			console.log(scrollTop);
			targetRotation = scrollTop * 0.001; // Настройте коэффициент по желанию
		};
		window.addEventListener('scroll', handleScroll);

		const onResize = () => {
			camera.aspect = window.innerWidth / window.innerHeight;
			camera.updateProjectionMatrix();
			renderer.setSize(window.innerWidth, window.innerHeight);
			composer.setSize(window.innerWidth, window.innerHeight);

			fxaaPass.material.uniforms['resolution'].value.x =
				1 / (window.innerWidth * renderer.getPixelRatio());
			fxaaPass.material.uniforms['resolution'].value.y =
				1 / (window.innerHeight * renderer.getPixelRatio());
		};
		window.addEventListener('resize', onResize);

		onDestroy(() => {
			window.removeEventListener('resize', onResize);

			if (animationId) {
				cancelAnimationFrame(animationId);
			}

			// Освобождаем ресурсы модели
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

			// Освобождаем HDR-текстуру
			if (hdrTexture) {
				hdrTexture.dispose();
				hdrTexture = null;
			}

			if (composer) {
				composer.dispose();
				composer = null;
			}

			disposeRenderer();
		});
	});
</script>

<div bind:this={mount}></div>

<style>
	:global(body) {
		margin: 0;
	}
	div {
		width: 100vw;
		height: 100vh;
	}
</style>
