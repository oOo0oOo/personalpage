import { AmbientLight, PointLight } from 'three';

import { config } from "../../main";

interface lightTypes {
    sunLight: PointLight;
    ambientLight: AmbientLight;
}

function createLights(): lightTypes {
    const sunLight = new PointLight('white', config.LIGHT_SUN, 1000, 0.1);

    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = config.SHADOW_MAP;
    sunLight.shadow.mapSize.height = config.SHADOW_MAP;
    sunLight.shadow.camera.near = 3;
    sunLight.shadow.camera.far = 1000;

    const ambientLight = new AmbientLight('white', config.LIGHT_AMBIENT);

    return { sunLight, ambientLight };
}

export { createLights };
