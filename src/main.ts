
import { Config } from './config';
export let config: Config = require('./config.json');

import { World } from './World/World';


// document.querySelector('#h1')?.append('Three.js Template');

async function main() {
    const container = document.querySelector(
        '#scene-container'
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
