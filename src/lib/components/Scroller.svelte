<!-- src/lib/components/Scroller.svelte -->
<script>
	// Любая необходимая логика
</script>

<div class="scroller">
	<div class="img-grid">
		<img src="/img/1.png" alt="" />
		<img src="/img/2.png" alt="" />
		<img src="/img/3.png" alt="" />
		<img src="/img/4.png" alt="" />
		<img src="/img/5.png" alt="" />
		<img src="/img/6.png" alt="" />
		<img src="/img/7.png" alt="" />
		<img src="/img/8.png" alt="" />
		<img src="/img/9.png" alt="" />
		<img src="/img/10.png" alt="" />

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
		object-fit: cover;
		width: 600px;
		height: 1200px;
		border-radius: 60px;
	}
</style>
