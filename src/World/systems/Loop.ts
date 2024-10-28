import {
    Clock,
    Object3D,
    Scene,
    WebGLRenderer,
} from 'three';

import { FocusCamera } from '../components/camera';
import { Annotation } from '../components/objects/annotation';

interface LoopTypes {
    camera: FocusCamera;
    scene: Scene;
    renderer: WebGLRenderer;
}

const clock = new Clock();
class Loop {
    camera: LoopTypes['camera'];
    scene: LoopTypes['scene'];
    renderer: LoopTypes['renderer'];
    updatables: any[];
    attracting: any[];
    attractRadius: number[];
    elapsedTime: number;
    currentFocus: Object3D;

    constructor({ camera, scene, renderer }: LoopTypes) {
        this.camera = camera;
        this.scene = scene;
        this.renderer = renderer;
        this.updatables = [];
        this.attracting = [];
        this.attractRadius = [];
        this.elapsedTime = 0;
        this.currentFocus = new Object3D();
    }

    start() {
        // Collect all attract radii
        this.attractRadius = this.attracting.map((obj) => obj.userData.radius);
        this.renderer.setAnimationLoop(() => {
            this.tick();
            this.renderer.render(this.scene, this.camera);
        });
    }

    stop() {
        this.renderer.setAnimationLoop(null);
    }

    tick() {
        let delta = clock.getDelta();
        this.elapsedTime += delta;

        // Get the positions of the objects to attract to
        const attractPositions = this.attracting.map((obj) => obj.position);

        for (const object of this.updatables) {
            // @ts-ignore
            object.tick(this.elapsedTime, delta, attractPositions, this.attractRadius);
        }

        Annotation.applyPendingUpdates();
    }

    setCurrentFocus(mesh: Object3D) {
        this.currentFocus = mesh;
    }
}

export { Loop };