import { MathUtils, PerspectiveCamera } from 'three';

function createCamera(): PerspectiveCamera {
    const camera = new PerspectiveCamera(
        35, // fov = Field Of View
        1, // aspect ratio (dummy value)
        1, // near clipping plane
        1000 // far clipping plane
    );

    camera.position.set(0, 10, 50);

    // @ts-ignore
    camera.tick = (delta: number) => { };

    return camera;
}

export { createCamera };
