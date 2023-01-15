
import {
    Object3D,
    PerspectiveCamera
} from 'three';

import { config } from '../../main';

export class FocusCamera extends PerspectiveCamera {
    focusObject: Object3D = new Object3D();
    focusDist: number = 0;

    constructor() {
        super(
            35, // fov = Field Of View
            1, // aspect ratio (dummy value)
            1, // near clipping plane
            1000 // far clipping plane
        );
    }

    setFocusObject(object: Object3D, distance: number) {
        this.focusObject = object;
        this.focusDist = distance;
    }

    tick(timeElapsed: number) {
        if (this.focusDist === 0) { return };

        let focusPos = this.focusObject.position.clone();

        // Move camera towards focusDist if we are not too close already
        var current_distance = this.position.distanceTo(focusPos);
        var distance_diff = this.focusDist - current_distance;
        if (Math.abs(distance_diff) > 0.1) {
            var direction = this.position.clone().sub(focusPos).normalize();
            this.position.add(direction.multiplyScalar(config.ZOOM_SPEED * distance_diff));
            this.updateProjectionMatrix();
        }
    }
}

function createCamera(): FocusCamera {
    const camera = new FocusCamera();
    camera.position.set(0, 10, 50);
    return camera;
}

export { createCamera };
