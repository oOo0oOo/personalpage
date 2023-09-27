import {
    Object3D,
    PerspectiveCamera,
    Vector3
} from 'three';

import { config, isMobile } from '../../main';

const cameraDirection = new Vector3(0, 0.2, 1);

export class FocusCamera extends PerspectiveCamera {
    focusObject: Object3D = new Object3D();
    focusDist: number = 0;
    focusHeight: number = 0;
    doAutoMove: boolean = true;
    startPos: Vector3 = cameraDirection.clone();

    constructor() {
        super(
            40, // fov = Field Of View
            1, // aspect ratio (dummy value)
            0.1, // near clipping plane
            1000 // far clipping plane
        );
    }

    setStartDistance() {
        // TODO: Dependent on display width
        if (isMobile) {
            this.startPos.copy(cameraDirection.multiplyScalar(200));
        } else {
            this.startPos.copy(cameraDirection.multiplyScalar(80));
        }
        this.position.copy(this.startPos);
    }

    setFocusSun() {
        this.focusObject = new Object3D();
        this.focusDist = 0;
        this.focusHeight = 0;
        this.doAutoMove = true;
    }

    setFocusObject(object: Object3D, distance: number, height: number) {
        this.focusObject = object;
        this.focusDist = distance;
        this.focusHeight = height;
        this.doAutoMove = true;
    }

    tick(timeElapsed: number) {
        if (!this.doAutoMove) { return };

        let focusPos;
        if (this.focusHeight === 0) {
            focusPos = this.startPos;
        } else {
            focusPos = this.focusObject.position.clone();
            focusPos.y = this.focusHeight;
        }

        // Move camera towards focusDist if we are not too close already
        var current_distance = this.position.distanceTo(focusPos);
        var distance_diff = this.focusDist - current_distance;
        var direction = focusPos.clone().sub(this.position).normalize();

        if (distance_diff > 0 && this.position.y < focusPos.y) {
            direction.y *= -1;
        }

        this.position.add(direction.multiplyScalar(-1 * config.ZOOM_SPEED * distance_diff));
        this.updateProjectionMatrix();
    }
}

function createCamera(): FocusCamera {
    const camera = new FocusCamera();
    return camera;
}

export { createCamera };
