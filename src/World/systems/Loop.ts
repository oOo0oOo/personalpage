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
    stats: Stats;
    elapsedTime: number;
    currentFocus: Object3D;

    constructor({ camera, scene, renderer }: LoopTypes) {
        this.camera = camera;
        this.scene = scene;
        this.renderer = renderer;
        this.updatables = [];
        this.stats = Stats();
        this.elapsedTime = 0;
        this.currentFocus = new Object3D();

        document.body.appendChild(this.stats.dom);
    }

    start() {
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
        this.elapsedTime += clock.getDelta();

        for (const object of this.updatables) {
            // @ts-ignore
            object.tick(this.elapsedTime);
        }
    }

    setCurrentFocus(mesh: Object3D) {
        this.currentFocus = mesh;
    }
}

export { Loop };
