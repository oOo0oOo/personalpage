import {
    Clock,
    Object3D,
    Scene,
    WebGL1Renderer,
    WebGLRenderer,
} from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';

import { FocusCamera } from '../components/camera';

interface LoopTypes {
    camera: FocusCamera;
    scene: Scene;
    renderer: WebGLRenderer | WebGL1Renderer;
}

const clock = new Clock();
class Loop {
    camera: LoopTypes['camera'];
    scene: LoopTypes['scene'];
    renderer: LoopTypes['renderer'];
    updatables: any[];
    attracting: any[];
    attractRadius: number[];
    stats: Stats;
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

        // Create FPS stats panel then add to dom
        this.stats = Stats();
        this.stats.dom.id = 'stats';
        this.stats.dom.removeAttribute('style');
        document.body.appendChild(this.stats.dom);
    }

    start() {
        // Collect all attract radii
        this.attractRadius = this.attracting.map((obj) => obj.userData.radius);

        this.renderer.setAnimationLoop(() => {
            this.tick();
            this.renderer.render(this.scene, this.camera);
            this.stats.update();
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
    }

    setCurrentFocus(mesh: Object3D) {
        this.currentFocus = mesh;
    }
}

export { Loop };
