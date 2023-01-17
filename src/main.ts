import { Config } from './config';
export let config: Config = require('../static/config.json');

import { World } from './World/World';

async function main() {
    const container = document.querySelector(
        '#scene_container'
    ) as HTMLCanvasElement;

    const world = new World(container);
    await world.init();
    world.start();

    // Various events on overlay
    // Detect dragging and wheel to stop camera auto movement
    let dragging = false;
    let mouseDown = false;

    addEventListener('mousedown', (evt) => {
        mouseDown = true;
        world.onMouseDown(evt);
    });

    addEventListener('mouseup', () => {
        mouseDown = false;
        dragging = false;
    });

    addEventListener('mousemove', () => {
        if (!dragging && mouseDown) {
            dragging = true;
            world.onDrag();
        }
    });

    addEventListener('wheel', () => {
        world.onScroll();
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

    document.querySelector('#info_hide')?.addEventListener('click', (evt) => {
        world.hideInfoBox();
    });

    // Get current #url and focus directly if it is set
    const url = new URL(window.location.href);
    const focus = url.hash.substring(1);
    if (focus) {
        // @ts-ignore
        world.changeCurrentFocus(focus);
    }
}

main().catch((err) => {
    console.log(err);
});
