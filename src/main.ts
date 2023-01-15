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

    addEventListener('mousedown', (evt) => {
        world.onMouseDown(evt);
    });
}

main().catch((err) => {
    console.log(err);
});
