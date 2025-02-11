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
  import { gsap } from 'gsap'
  import { isLoaded } from '../stores/loading.js';
	import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
	import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';
	import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
	import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
	import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
	import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
	import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

	import { getRenderer, disposeRenderer } from '../renderer.js';

	import Scroller from '../components/Scroller.svelte';
	import html2canvas from 'html2canvas';

	let mountWebGL;

	let hdrTexture;

	let model;
	let scene;
	let camera;
	let animationId;

	let scrollerContainer;
	let scrollerTexture;
	let scrollerMesh;

	let targetRingRotation = 0;
	let targetScroll = 0;
	let currentRingRotation = 0;
	let currentScroll = 0;

	const BLOOM_SCENE = 1;
	const bloomLayer = new THREE.Layers();
	bloomLayer.set(BLOOM_SCENE);
	const darkMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
	const materials = {};

	function restoreMaterial(obj) {
		if (materials[obj.uuid]) {
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

   function createSceneAndCamera() {
    return new Promise((resolve) => {
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.set(0, 0, 50);
      camera.lookAt(0, 0, 0);
      resolve();
    });
   }

   function loadHDRI() {
    return new Promise((resolve, reject) => {
      const hdrLoader = new EXRLoader();
      hdrLoader.load('/models/studio_small_09_4k.exr', (texture) => {
        hdrTexture = texture;
        hdrTexture.mapping = THREE.EquirectangularReflectionMapping;
        scene.environment = hdrTexture;
        scene.background = new THREE.Color(0xffffff);
        resolve()
      }, undefined, reject);
    })
   }

   let renderer;
   let bloomComposer;
   let finalComposer;
   let renderScene;
   let mixPass;
   let outputPass;


   function composeAll() {
    return new Promise((resolve, reject) => {
      renderer = getRenderer();
      mountWebGL.appendChild(renderer.domElement);
   
      renderScene = new RenderPass(scene, camera);
   
      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        0.3,
        0.1,
        0.1
      );
   
      bloomComposer = new EffectComposer(renderer);
      bloomComposer.renderToScreen = false;
      bloomComposer.addPass(renderScene);
      bloomComposer.addPass(bloomPass);
   
      mixPass = new ShaderPass(
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
   
      outputPass = new OutputPass();
   
      finalComposer = new EffectComposer(renderer);
      finalComposer.addPass(renderScene);
      finalComposer.addPass(mixPass);
      finalComposer.addPass(outputPass);

      resolve();
    })
   }

   function sleep(time) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve()
      }, time)
    })
    }


    function addScroller() {
      return new Promise((resolve, reject) => {
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
          model.position.set(0, 1, 0);
          model.rotation.set(-2, -5, -3);
          model.scale.set(0, 0, 0);
          resolve();
        }, undefined, reject);
      })
    }

    function addRing() {
      return new Promise((resolve, reject) => {
        if (scrollerContainer) {
          html2canvas(scrollerContainer, {
            scale: 1,
            ignoreElements: (el) => el.tagName === 'CANVAS',
            useCORS: true,
            backgroundColor: null
          }).then((canvas) => {
            scrollerTexture = new THREE.CanvasTexture(canvas);
            scrollerTexture.minFilter = THREE.LinearFilter;
            scrollerTexture.magFilter = THREE.LinearFilter;
    
            const planeGeometry = new THREE.PlaneGeometry(10, 80);
            const planeMaterial = new THREE.MeshBasicMaterial({
              map: scrollerTexture,
              side: THREE.DoubleSide,
              transparent: true
            });
            scrollerMesh = new THREE.Mesh(planeGeometry, planeMaterial);
            scene.add(scrollerMesh);
            resolve();
          }).catch(reject);
        }
      })
    }
  



		let lastTime = 0;
		const fps = 200;
		const frameInterval = 1000 / fps;

		 function animate(time) {
			animationId = requestAnimationFrame(animate);
			if (time - lastTime > frameInterval) {
				lastTime = time;
				currentRingRotation = lerp(currentRingRotation, targetRingRotation, 0.05);
				currentScroll = lerp(currentScroll, targetScroll, 0.1);
				if (model) {
					model.rotation.x = currentRingRotation;
				}
				if (scrollerMesh) {
					scrollerMesh.position.y = currentScroll - 30;
				}

        scene.background = new THREE.Color(0x000000);
				scene.traverse(nonBloomed);
				bloomComposer.render();
				scene.traverse(restoreMaterial);
        scene.background = new THREE.Color(0xffffff);

				// render the entire scene, then render bloom scene on top
				finalComposer.render();
			}
		}

     function preanimate() {
      scrollerMesh.scale.set(0, 0, 0);
      gsap.to(model.scale, { x: 5, y: 5, z: 5, duration: 2, ease: 'power2.out' });
      gsap.to(model.rotation, { x: 0, y: 0.3, z: 0.3, duration: 3, ease: 'power2.out' });
      setTimeout(() => {
        gsap.to(scrollerMesh.scale, { x: 1, y: 1, z: 1, duration: 2, ease: 'power2.out' });
      }, 500);
    }

    Promise.all([createSceneAndCamera(), loadHDRI(), composeAll(), addRing(), addScroller(), sleep(1000)]).then(async () => {
      console.log("Все загружено, мой господин");
      await isLoaded.set(true);
      await preanimate();
      animate();
    }).catch((error) => {
      console.log("Ошибочка, мой господин:", error);
    })

		const handleScroll = () => {
			const scrollTop = window.scrollY || window.pageYOffset;
			targetRingRotation = scrollTop * 0.002;
			targetScroll = scrollTop * 0.06;
			clearTimeout(handleScroll._timeout);
		};

		window.addEventListener('scroll', handleScroll);

		const onResize = () => {
			camera.aspect = window.innerWidth / window.innerHeight;
			camera.updateProjectionMatrix();
			renderer.setSize(window.innerWidth, window.innerHeight);
			finalComposer.setSize(window.innerWidth, window.innerHeight);
			bloomComposer.setSize(window.innerWidth, window.innerHeight);
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
			if (bloomComposer) {
				bloomComposer.dispose();
				bloomComposer = null;
			}
			if (finalComposer) {
				finalComposer.dispose();
				finalComposer = null;
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
	<div style="width: fit-content; height: fit-content; border-radius: 60px; background-color: transparent;" bind:this={scrollerContainer}>
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
