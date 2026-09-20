import { WebGLRenderer, BasicShadowMap } from 'three';

import { config, isMobile } from '../../main';

function createRenderer() {
    // On high-DPI displays the extra samples are not worth their cost: the
    // higher pixel density already hides most aliasing. Only ask for MSAA
    // when we are rendering at 1x. (Resizer clamps the ratio we actually use.)
    let pixelRatio = window.devicePixelRatio
    let AA = pixelRatio <= 1

    const renderer = new WebGLRenderer({ antialias: AA, powerPreference: 'high-performance' });
    renderer.setClearColor(config.COLOR_BACKGROUND);

    if (!isMobile) {
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = BasicShadowMap; // options: BasicShadowMap, PCFShadowMap, PCFSoftShadowMap
    }
    return renderer;
}

export { createRenderer };
