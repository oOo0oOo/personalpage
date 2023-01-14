import {
    AmbientLight,
    PointLight,
    HemisphereLight,
    MathUtils,
} from 'three';

import { config } from '../../main';

interface lightTypes {
    sunLight: PointLight;
    ambientLight: AmbientLight;
    hemisphereLight: HemisphereLight;
}

function createLights(): lightTypes {
    const sunLight = new PointLight('white', 4, 1000, 0.1);

    if (config.SHADOWS) {
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.camera.near = 3;
        sunLight.shadow.camera.far = 1000;
    }

    const ambientLight = new AmbientLight('white', 0.35);

    // uses a bright sky color and a dark ground color
    const hemisphereLight = new HemisphereLight('white', 'darkslategray', 0);

    return { sunLight, ambientLight, hemisphereLight };
}

export { createLights };
