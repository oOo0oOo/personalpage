import {
    AmbientLight,
    PointLight
} from 'three';

interface lightTypes {
    sunLight: PointLight;
    ambientLight: AmbientLight;
}

function createLights(): lightTypes {
    const sunLight = new PointLight('white', 4, 1000, 0.1);

    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 3;
    sunLight.shadow.camera.far = 1000;

    const ambientLight = new AmbientLight('white', 0.35);

    return { sunLight, ambientLight };
}

export { createLights };
