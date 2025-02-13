<script>
	import Scene from '../lib/components/Scene.svelte';
	import Ghost from '../lib/components/Ghost.svelte';
  import { isLoaded } from '../lib/stores/loading.js';
  console.log(isLoaded)
</script>

<div class="scroll-container">
	<div class="ring-container">
		<Scene />
	</div>
	<div class="center-content">
    <Ghost />
	</div>
  <div class="black-cover" class:loaded={$isLoaded}></div>
</div>

<style>
	.scroll-container {
		height: 260vh;
		position: relative;
	}

	.ring-container {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 100%;
		height: 100%;
		pointer-events: none;
		z-index: -1;
	}

  .black-cover {
    opacity: 1;
    position: absolute;
    background-color: white;
    width: 100%;
    height: 100%;
    z-index: 9999;
    transition: opacity 1s;
  }

  .black-cover.loaded {
    	opacity: 0;
    	pointer-events: none;
  	}
</style>
