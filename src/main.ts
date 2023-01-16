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

    document.querySelector('#info_hide')?.addEventListener('click', (evt) => {
        world.hideInfo();
    });

    // Detect click on annotation title
    let annotationTitles = document.querySelectorAll(".annotation-title");
    for (let i = 0; i < annotationTitles.length; i++) {
        annotationTitles[i].addEventListener('click', (evt) => {
            // Get id from data attribute
            const id = (evt.target as HTMLDivElement).dataset.id;
            // @ts-ignore
            world.changeCurrentFocus(id);
        });
    }
}

main().catch((err) => {
    console.log(err);
});
