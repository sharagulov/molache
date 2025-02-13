<script>
  import { scroll } from '../stores/scroll.js';
  import Scroller from './Scroller.svelte';
  import { onMount } from 'svelte';
  import { gsap } from 'gsap';

</script>

<div class="ghost-container">
  <div class="cards" style="transform: translateY({$scroll.current}px);"><Scroller /></div>
</div>

<style>
  .ghost-container {
    display: flex;
    justify-content: center;
    position: absolute;
    width: 100%;
    height: 100%;
    padding-top: 165px;
    padding-left: 10px;
    overflow-y: hidden;
  }

  .cards {}
</style>
