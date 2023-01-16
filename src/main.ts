import { Config } from './config';
export let config: Config = require('./config.json');

import { World } from './World/World';

async function main() {
    const container = document.querySelector(
        '#scene_container'
    ) as HTMLCanvasElement;

    const world = new World(container);
    await world.init();
    world.start();

    // Various events
    addEventListener('mousedown', (evt) => {
        world.onMouseDown(evt);
    });

    // Detect click on info_hide
    const info_hide = document.querySelector('#info_hide');

    // @ts-ignore
    info_hide.addEventListener('click', (evt) => {
        world.hideInfo();
    });
}

main().catch((err) => {
    console.log(err);
});
