import {
    Object3D,
    PerspectiveCamera,
    Vector3
} from 'three';

import { config, isMobile } from '../../main';

export class FocusCamera extends PerspectiveCamera {
    focusObject: Object3D = new Object3D();
    focusDist: number = 0;
    focusHeight: number = 0;
    doAutoMove: boolean = true;
    startPos: Vector3 = new Vector3(0, 10, 50);

    constructor() {
        super(
            40, // fov = Field Of View
            1, // aspect ratio (dummy value)
            0.1, // near clipping plane
            1000 // far clipping plane
        );

        // Mobile --> start further away to show everything
        if (isMobile) {
            this.startPos = new Vector3(0, 16, 120);
        };

        this.position.copy(this.startPos);
    }

    setFocusObject(object: Object3D, distance: number, height: number) {
        this.focusObject = object;
        this.focusDist = distance;
        this.focusHeight = height;
        this.doAutoMove = true;
    }

    tick(timeElapsed: number) {
        if (this.focusHeight === 0 || !this.doAutoMove) { return };

        let focusPos;
        if (this.focusHeight === config.HEIGHT_SUN){
            focusPos = this.startPos;
        } else {
            focusPos = this.focusObject.position.clone();
            focusPos.y = this.focusHeight;
        }
            
        // Move camera towards focusDist if we are not too close already
        var current_distance = this.position.distanceTo(focusPos);
        var distance_diff = this.focusDist - current_distance;
        var direction = this.position.clone().sub(focusPos).normalize();

        this.position.add(direction.multiplyScalar(config.ZOOM_SPEED * distance_diff));
        this.updateProjectionMatrix();
    }
}

function createCamera(): FocusCamera {
    const camera = new FocusCamera();
    return camera;
}

export { createCamera };
