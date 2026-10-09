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
// A DPR cap alone still creates an enormous buffer on a large desktop display.
// Bound fragment work to a 1440p buffer, keeping CSS-sized labels sharp.
const MAX_RENDER_PIXELS = 2560 * 1440;

const setSize = ({ container, camera, renderer }: ResizerTypes) => {
  const width = Math.max(1, container.clientWidth);
  const height = Math.max(1, container.clientHeight);
  camera.aspect = width / height;
  camera.updateProjectionMatrix(); // automatically recalculate the frustrum
  renderer.setPixelRatio(Math.min(
    window.devicePixelRatio,
    MAX_PIXEL_RATIO,
    Math.sqrt(MAX_RENDER_PIXELS / (width * height)),
  ));
  renderer.setSize(width, height);
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
