import { Config } from './config';
export const config: Config = require('../static/config.json');

// Mobile: 
// Camera sun position is further away to show everything
// No lights and shadows to improve performance
export const isMobile = window.innerWidth < 768 || window.innerHeight < 768;

import { World } from './World/World';

export let technologyTemplates: Map<string, HTMLDivElement>[];

async function main() {
    let color = config.COLOR_TECHNOLOGIES;

    // Create all technologyTemplates from config
    for (const tech of config.TECHNOLOGIES) {
        let el = document.querySelector("#technology_template")?.cloneNode(true) as HTMLDivElement;

        // Set title
        if (tech.title !== undefined) {
            // @ts-ignore
            el.querySelector("#technology_title")?.innerHTML = tech.title;
        };

        // Set icon
        // @ts-ignore
        let url = `https://api.iconify.design/${tech.icon}.svg?color=${color}`;
        el.querySelector("#technology_icon")?.setAttribute("src", url);

        // Set element id
        el.id = "tech_" + tech.id;

        // Add to DOM
        document.querySelector("#technology_container")?.append(el);
    }


    // Setup the three js scene
    const container = document.querySelector(
        '#scene_container'
    ) as HTMLCanvasElement;

    const world = new World(container);
    await world.init();
    world.start();

    // Detect dragging and wheel to stop camera auto movement
    let dragging = false;
    let dragDistance = 0;
    let mouseDown = false;

    // Events for mouse or touch
    if (!isMobile) {
        // Detect mouse events on desktop
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
                if (!dragging && dragDistance > 8) {
                    dragging = true;
                    world.onDrag();
                }
            }
        });
    } else {
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
    }

    addEventListener('wheel', () => {
        world.onScroll();
    });

    // Detect click on annotation title
    let annotationTitles = document.querySelectorAll(".annotation-title");
    for (let i = 0; i < annotationTitles.length; i++) {
        if (!isMobile) {
            annotationTitles[i].addEventListener('mousedown', (evt) => {
                // Get id from data attribute
                const id = (evt.target as HTMLDivElement).dataset.id;
                // @ts-ignore
                world.changeCurrentFocus(id);
            });
        } else {
            annotationTitles[i].addEventListener('touchstart', (evt) => {
                // Get id from data attribute
                const id = (evt.target as HTMLDivElement).dataset.id;
                // @ts-ignore
                world.changeCurrentFocus(id);
            });
        }
    }

    document.querySelector('#info_hide')?.addEventListener('click', () => {
        world.hideInfoBox();
    });

    document.querySelector('#info_hide')?.addEventListener('touchstart', () => {
        world.hideInfoBox();
    });

    // On page load: Get current #url and focus directly if it is set
    const url = new URL(window.location.href);
    const focus = url.hash.substring(1);
    if (focus) {
        // @ts-ignore
        world.changeCurrentFocus(focus);
    }

    // Detect hashchange (usually back button in browser)
    window.addEventListener('hashchange', () => {
        const url = new URL(window.location.href);
        const focus = url.hash.substring(1);
        if (focus) {
            // @ts-ignore
            world.changeCurrentFocus(focus);
        } else {
            world.changeCurrentFocus("sun");
        }
    });
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