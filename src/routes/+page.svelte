<script>
	import Ring from '../lib/components/Ring.svelte';
</script>

<div class="scroll-container">
	<div>asdsa</div>
	<div class="ring-container">
		<Ring />
	</div>
	<!-- Дополнительный контент для скролла можно добавить здесь -->
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
	}
</style>
