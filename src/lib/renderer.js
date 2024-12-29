// renderer.js

import * as THREE from 'three';

let renderer = null;

export function getRenderer() {
	if (!renderer) {
		renderer = new THREE.WebGLRenderer({ antialias: true });
		renderer.toneMapping = THREE.ACESFilmicToneMapping;
		renderer.toneMappingExposure = 0.5;
		renderer.setSize(window.innerWidth, window.innerHeight);
	}
	return renderer;
}

export function disposeRenderer() {
	if (renderer) {
		renderer.dispose();
		renderer = null;
	}
}
