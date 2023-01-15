import { OrthographicCamera, PerspectiveCamera, Object3D } from 'three';
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

    tick(timeElapsed: number) {
        if (this.targetObject === null) { return };

        // Move target towards targetObjects position
        let focusPos = this.targetObject.position.clone();
        this.target.add(focusPos.sub(this.target).multiplyScalar(0.07));
        this.update();
    }
}

function createControls({ camera, canvas }: controlsTypes): FocusControls {
    return new FocusControls(camera, canvas);
}

export { createControls };
