// src/stores/scroll.js
import { writable } from 'svelte/store';

function createScrollStore() {
  const { subscribe, set } = writable({ current: 0, target: 0 });

  if (typeof window !== 'undefined') {
    let currentScroll = 0;
    let targetScroll = 0;
    const lerp = (a, b, t) => a + (b - a) * t;
    let lastTime = 0;
    const fps = 200;
    const frameInterval = 1000 / fps;

    const updateScroll = () => {
      const scrollTop = window.scrollY || window.pageYOffset;
      targetScroll = scrollTop * 0.0475;
    };

    window.addEventListener('scroll', updateScroll);

    const animate = (time) => {
      requestAnimationFrame(animate);
      if (time - lastTime > frameInterval) {
        lastTime = time;
        currentScroll = lerp(currentScroll, targetScroll, 1);
        set({ current: currentScroll, target: targetScroll });
      }
    };

    requestAnimationFrame(animate);
  }

  return { subscribe };
}

export const scroll = createScrollStore();
