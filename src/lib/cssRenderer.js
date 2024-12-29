// src/lib/cssRenderer.js

import { CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer.js';

let cssRenderer = null;

export function getCSSRenderer() {
	if (!cssRenderer) {
		cssRenderer = new CSS3DRenderer();
		cssRenderer.setSize(window.innerWidth, window.innerHeight);
		cssRenderer.domElement.style.position = 'absolute';
		cssRenderer.domElement.style.top = '0';
		cssRenderer.domElement.style.left = '0';
		cssRenderer.domElement.style.pointerEvents = 'none'; // Позволяет взаимодействовать с WebGL-слоем
	}
	return cssRenderer;
}

export function disposeCSSRenderer() {
	if (cssRenderer) {
		if (cssRenderer.domElement && cssRenderer.domElement.parentNode) {
			cssRenderer.domElement.parentNode.removeChild(cssRenderer.domElement);
		}
		cssRenderer = null;
	}
}
