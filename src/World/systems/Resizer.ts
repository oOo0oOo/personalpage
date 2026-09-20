import { PerspectiveCamera, WebGLRenderer } from 'three';

interface ResizerTypes {
  container: HTMLCanvasElement;
  camera: PerspectiveCamera;
  renderer: WebGLRenderer;
}

// Rendering cost scales with the square of the pixel ratio. Beyond 2x the
// difference is not visible, so clamp it: a 3x phone would otherwise shade
// nine times the fragments of a 1x display.
const MAX_PIXEL_RATIO = 2;

const setSize = ({ container, camera, renderer }: ResizerTypes) => {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix(); // automatically recalculate the frustrum
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));
};
class Resizer {
  constructor({ container, camera, renderer }: ResizerTypes) {
    setSize({ container, camera, renderer });

    window.addEventListener('resize', () => {
      setSize({ container, camera, renderer });
      this.onResize(); // custom event hook
    });
  }

  onResize() {}
}

export { Resizer };
