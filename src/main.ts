import { Config } from './config';
export const config: Config = require('../static/config.json');

// Mobile: 
// Camera sun position is further away to show everything
// No lights and shadows to improve performance
export const isMobile = window.innerWidth < 768 || window.innerHeight < 768;

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
    let dragDistance = 0;
    let mouseDown = false;

    addEventListener('mousedown', (evt) => {
        mouseDown = true;
        dragDistance = 0;
        world.onMouseDown(evt);
    });

    addEventListener('mouseup', () => {
        mouseDown = false;
        dragging = false;
    });

    addEventListener('mousemove', (evt) => {
        if (mouseDown) {
            dragDistance += Math.abs(evt.movementX) + Math.abs(evt.movementY);
        }
        if (!dragging && mouseDown && dragDistance > 8) {
            dragging = true;
            world.onDrag();
        }
    });

    addEventListener('wheel', () => {
        world.onScroll();
    });

    // Detect touch events on mobile (ignore zoom gesture for now)
    addEventListener('touchstart', (evt) => {
        mouseDown = true;
        world.onMouseDown(evt);
    });

    addEventListener('touchend', () => {
        mouseDown = false;
        dragging = false;
    });

    addEventListener('touchmove', () => {
        // There is no evt.movementX/Y on mobile
        if (!dragging && mouseDown) {
            dragging = true;
            world.onDrag();
        }
    });

    // Detect click on annotation title
    let annotationTitles = document.querySelectorAll(".annotation-title");
    for (let i = 0; i < annotationTitles.length; i++) {
        annotationTitles[i].addEventListener('mousedown', (evt) => {
            // Get id from data attribute
            const id = (evt.target as HTMLDivElement).dataset.id;
            // @ts-ignore
            world.changeCurrentFocus(id);
        });
        annotationTitles[i].addEventListener('touchstart', (evt) => {
            // Get id from data attribute
            const id = (evt.target as HTMLDivElement).dataset.id;
            // @ts-ignore
            world.changeCurrentFocus(id);
        });
    }

    document.querySelector('#info_hide')?.addEventListener('click', () => {
        world.hideInfoBox();
    });
    
    document.querySelector('#info_hide')?.addEventListener('touchstart', () => {
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

// Log errors in development mode
const isDev = process.env.NODE_ENV === 'development';
if (isDev) {
    main().catch((err) => {
        console.log(err);
    });
} else {
    main();
}