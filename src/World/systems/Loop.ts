import {
    Object3D,
    Scene,
    WebGLRenderer,
} from 'three';

import { FocusCamera } from '../components/camera';
import { Annotation } from '../components/objects/annotation';
import { FocusControls } from './controls';

interface LoopTypes {
    camera: FocusCamera;
    scene: Scene;
    renderer: WebGLRenderer;
    controls: FocusControls;
}

// Shadows only move as fast as the orbits, so refreshing the cube shadow map
// every other frame is not visible but halves its (six-pass) cost.
const SHADOW_UPDATE_INTERVAL = 2;

class Loop {
    camera: LoopTypes['camera'];
    scene: LoopTypes['scene'];
    renderer: LoopTypes['renderer'];
    controls: LoopTypes['controls'];
    updatables: any[];
    annotations: Annotation[];
    attracting: any[];
    attractRadius: number[];
    elapsedTime: number;
    currentFocus: Object3D;
    lastTime: number | null;
    frame: number;
    removals: any[];

    constructor({ camera, scene, renderer, controls }: LoopTypes) {
        this.camera = camera;
        this.scene = scene;
        this.renderer = renderer;
        this.controls = controls;
        this.updatables = [];
        this.annotations = [];
        this.attracting = [];
        this.attractRadius = [];
        this.elapsedTime = 0;
        this.currentFocus = new Object3D();
        this.lastTime = null;
        this.frame = 0;
        this.removals = [];
    }

    start() {
        // Collect all attract radii
        this.attractRadius = this.attracting.map((obj) => obj.userData.radius);
        this.renderer.setAnimationLoop((time: number) => {
            this.tick(time);
            if (this.renderer.shadowMap.enabled) {
                this.renderer.shadowMap.needsUpdate = this.frame % SHADOW_UPDATE_INTERVAL === 0;
            }
            this.frame++;
            this.renderer.render(this.scene, this.camera);
        });
    }

    stop() {
        this.renderer.setAnimationLoop(null);
        this.lastTime = null;
    }

    // Deferred to the end of the tick, since comets remove themselves while
    // updatables is being iterated. Removing one that is already gone is a no-op.
    remove(object: any) {
        this.removals.push(object);
    }

    tick(time: number) {
        // Use the vsync-aligned frame timestamp rather than reading the clock
        // when the callback happens to run: Firefox coarsens performance.now()
        // and the callback start drifts, which made the orbits jitter.
        // Clamp the step so a backgrounded tab does not jump on return.
        let delta = this.lastTime === null ? 0 : Math.min((time - this.lastTime) / 1000, 0.1);
        this.lastTime = time;
        this.elapsedTime += delta;

        // Get the positions of the objects to attract to
        const attractPositions = this.attracting.map((obj) => obj.position);

        for (const object of this.updatables) {
            // @ts-ignore
            object.tick(this.elapsedTime, delta, attractPositions, this.attractRadius);
        }

        for (const object of this.removals) {
            const index = this.updatables.indexOf(object);
            if (index !== -1) this.updatables.splice(index, 1);
        }
        this.removals.length = 0;

        // Follow this frame's body positions, then project labels with the same
        // camera matrices the renderer will use. Rendering used to update those
        // matrices only after the labels had already used last frame's view.
        this.camera.tick(this.elapsedTime, delta);
        this.controls.tick(this.elapsedTime, delta);
        this.camera.updateMatrixWorld();
        for (const annotation of this.annotations) {
            annotation.tick(this.elapsedTime);
        }
        Annotation.applyPendingUpdates();
    }

    setCurrentFocus(mesh: Object3D) {
        this.currentFocus = mesh;
    }
}

export { Loop };
