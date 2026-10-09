import { Object3D } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { FocusCamera } from '../components/camera';

interface controlsTypes {
    camera: FocusCamera;
    canvas: HTMLCanvasElement;
}

export class FocusControls extends OrbitControls {
    targetObject: Object3D;
    constructor(camera: FocusCamera, canvas: HTMLCanvasElement) {
        super(camera, canvas);
        this.minDistance = 0.1;
        this.maxDistance = 1000;
        this.enablePan = false;

        this.targetObject = new Object3D();
    }

    setTargetObject(object: Object3D) {
        this.targetObject = object;
    }

    tick(timeElapsed: number, delta: number) {
        if (this.targetObject === null) { return };

        // Move target towards targetObjects position
        const smoothing = 1 - Math.pow(1 - 0.07, delta * 60);
        this.target.lerp(this.targetObject.position, smoothing);
        this.update();
    }
}

function createControls({ camera, canvas }: controlsTypes): FocusControls {
    return new FocusControls(camera, canvas);
}

export { createControls };
