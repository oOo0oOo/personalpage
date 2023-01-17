import { Color, Scene } from 'three';

function createScene({ backgroundColor }: { backgroundColor: string }): Scene {
    const scene = new Scene();
    scene.background = new Color(backgroundColor);
    return scene;
}

export { createScene };
