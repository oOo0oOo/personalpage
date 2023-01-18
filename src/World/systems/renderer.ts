import { WebGLRenderer, PCFShadowMap } from 'three';

import { config, isMobile } from '../../main';

function createRenderer() {
    let pixelRatio = window.devicePixelRatio
    let AA = true
    if (pixelRatio > 1) {
        AA = false
    }

    const renderer = new WebGLRenderer({ antialias: AA, powerPreference: 'high-performance' });
    renderer.setClearColor(config.COLOR_BACKGROUND);

    if (!isMobile) {
        renderer.physicallyCorrectLights = true;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = PCFShadowMap; // options: BasicShadowMap, PCFShadowMap, PCFSoftShadowMap
    }
    return renderer;
}

export { createRenderer };
