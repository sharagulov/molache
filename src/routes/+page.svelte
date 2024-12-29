<script>
	import Scene from '../lib/components/Scene.svelte';
</script>

<div class="scroll-container">
	<div class="ring-container">
		<Scene />
	</div>
	<div class="center-content">
		<!-- <CenterContent /> Новый компонент с div-контейнерами -->
	</div>
	<div class="content">Прокрутите вниз, чтобы увидеть эффект вращения кольца.</div>
</div>

<style>
	.scroll-container {
		height: 200vh; /* Удваиваем высоту окна для вертикального скролла */
		position: relative;
	}

	.ring-container {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 100%;
		height: 100%;
		pointer-events: none; /* Чтобы скролл был доступен через кольцо */
		z-index: -1;
	}

	.content {
		z-index: 1;
	}
</style>
