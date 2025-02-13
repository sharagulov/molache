<!-- src/lib/components/Scroller.svelte -->
<script>
  import { isLoaded } from '../stores/loading.js';
	// Любая необходимая логика
</script>

<div class="scroller">
	<div class="img-grid">
    <img class="imege" class:loaded={$isLoaded} src="/img/1.png" alt="" />
		<img class="imege" class:loaded={$isLoaded} src="/img/5.png" alt="" />
		<img class="imege" class:loaded={$isLoaded} src="/img/2.png" alt="" />
		<img class="imege" class:loaded={$isLoaded} src="/img/3.png" alt="" />
		<img class="imege" class:loaded={$isLoaded} src="/img/7.png" alt="" />
		<img class="imege" class:loaded={$isLoaded} src="/img/6.png" alt="" />
		<img class="imege" class:loaded={$isLoaded} src="/img/8.png" alt="" />
		<img class="imege" class:loaded={$isLoaded} src="/img/9.png" alt="" />
		<img class="imege" class:loaded={$isLoaded} src="/img/4.png" alt="" />
		<img class="imege" class:loaded={$isLoaded} src="/img/7.png" alt="" />
		<img class="imege" class:loaded={$isLoaded} src="/img/1.png" alt="" />
		<img class="imege" class:loaded={$isLoaded} src="/img/6.png" alt="" />
		<img class="imege" class:loaded={$isLoaded} src="/img/10.png" alt="" />
		<img class="imege" class:loaded={$isLoaded} src="/img/3.png" alt="" />
		<img class="imege" class:loaded={$isLoaded} src="/img/4.png" alt="" />
		<img class="imege" class:loaded={$isLoaded} src="/img/5.png" alt="" />
		<img class="imege" class:loaded={$isLoaded} src="/img/2.png" alt="" />
		<img class="imege" class:loaded={$isLoaded} src="/img/8.png" alt="" />
		<img class="imege" class:loaded={$isLoaded} src="/img/9.png" alt="" />
		<img class="imege" class:loaded={$isLoaded} src="/img/10.png" alt="" />

	</div>
</div>

<style>
	.scroller {
		width: fit-content;
		height: fit-content;
		display: block;
		margin: 0;
		padding: 0;
		font-size: 100px;
	}

	.img-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 10px;
	}

	img {
		object-fit: contain;
		height: 152px;
    transition: all 0s;
	}

  .imege {
    opacity: 1;
  }

  .imege.loaded {
    opacity: 0;
    height: 20.6vh;
    transition: all 1s;
  }

  .imege.loaded:hover {
    opacity: 1;
  }
</style>
