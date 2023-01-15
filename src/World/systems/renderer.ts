import { WebGLRenderer, PCFShadowMap } from 'three';

import { config } from '../../main';

function createRenderer() {
    let pixelRatio = window.devicePixelRatio
    let AA = true
    if (pixelRatio > 1) {
        AA = false
    }

    const renderer = new WebGLRenderer({ antialias: AA, powerPreference: 'high-performance' });
    renderer.physicallyCorrectLights = true;
    renderer.setClearColor(config.COLOR_BACKGROUND);

    if (config.SHADOWS) {
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = PCFShadowMap; // options: BasicShadowMap, PCFShadowMap, PCFSoftShadowMap
    }
    return renderer;
}

export { createRenderer };
