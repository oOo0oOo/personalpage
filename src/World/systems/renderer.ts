import { WebGLRenderer, PCFShadowMap } from 'three';

import { config } from '../../main';

function createRenderer() {
    const renderer = new WebGLRenderer({ antialias: true });
    renderer.physicallyCorrectLights = true;
    renderer.setClearColor(config.COLOR_BACKGROUND);

    if (config.SHADOWS) {
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = PCFShadowMap; // options: BasicShadowMap, PCFShadowMap, PCFSoftShadowMap
    }
    return renderer;
}

export { createRenderer };
