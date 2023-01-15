import {
    OrthographicCamera,
    PerspectiveCamera,
    Raycaster,
    Scene,
    WebGL1Renderer,
    WebGLRenderer,
    Vector2
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { createCamera } from './components/camera';
import { createAxesHelper, createGridHelper } from './components/helpers';
import { createLights } from './components/lights';
import { createBody } from './components/objects/body';
import { createScene } from './components/scene';
import { createControls } from './systems/controls';
import { Loop } from './systems/Loop';
import { createRenderer } from './systems/renderer';
import { Resizer } from './systems/Resizer';

import { FocusCamera } from './components/camera';
import { FocusControls } from './systems/controls';

import { config } from '../main';

/**
 * If two instances of the World class are created, the second instance will
 * overwrite the module scoped variables below from the first instance.
 * Accordingly, only one World class should be used at a time.
 */
let camera: FocusCamera;
let scene: Scene;
let renderer: WebGLRenderer | WebGL1Renderer;
let controls: FocusControls;
let loop: Loop;
let isRunning: boolean;
let raycaster: Raycaster;
let currentFocus: string;
let categoryIds: string[];

class World {
    constructor(container: HTMLCanvasElement) {
        camera = createCamera();
        raycaster = new Raycaster();
        currentFocus = "sun";

        /**
         * Set the scene's background color to the same as the container's
         * background color in index.css to prevent flashing on load
         * (src/styles/index.css #scene-container)
         */
        scene = createScene({ backgroundColor: config.COLOR_BACKGROUND });
        renderer = createRenderer();
        controls = createControls({ camera: camera, canvas: renderer.domElement });
        loop = new Loop({ camera, scene, renderer });
        loop.updatables.push(controls);
        loop.updatables.push(camera);
        container.append(renderer.domElement);

        const { sunLight, ambientLight } = createLights();
        scene.add(sunLight, ambientLight);

        new Resizer({ container, camera, renderer });

        // Get all category ids
        categoryIds = [];
        for (let i = 0; i < config.CONTENT.length; i++) {
            categoryIds.push(config.CONTENT[i].id);
        }
    }

    async init() {
        // Create the sun
        const sun = await createBody({ bodyType: "sun", id: "sun" });
        controls.target.copy(sun.position);
        loop.updatables.push(sun);
        scene.add(sun);

        // Pick orbits and angles for all categories
        let orbits: number[] = [];
        let startAngle: number[] = [];
        let velocities: number[] = [];

        for (let i = 0; i < config.CONTENT.length; i++) {
            var orbit = config.SCALE_PLANET_ORBIT * (0.2 + 0.8 * (i / config.CONTENT.length));
            var angle = 2 * Math.PI * Math.random();
            var velocity = Math.sqrt(config.GRAVITY / orbit);

            orbits.push(orbit);
            startAngle.push(angle);
            velocities.push(velocity);
        }

        // Create all categories
        for (let i = 0; i < config.CONTENT.length; i++) {
            let orbit: number[] = [orbits[i]];
            let startA: number[] = [startAngle[i]];
            let velocit: number[] = [velocities[i]];
            let catId = config.CONTENT[i].id;
            const categoryBody = await createBody({ id: catId, bodyType: "planet", orbit: orbit, startAngle: startA, velocities: velocit });
            loop.updatables.push(categoryBody);
            scene.add(categoryBody);

            // Create all projects as moons of the category
            let numMoons = config.CONTENT[i].projects.length;
            for (let j = 0; j < config.CONTENT[i].projects.length; j++) {
                let orbitMoon: number = config.SCALE_MOON_ORBIT * (0.25 + 0.75 * (j / numMoons));
                let startAngleMoon: number = 2 * Math.PI * Math.random();
                let velocityMoon: number = Math.sqrt(config.GRAVITY / orbitMoon);
                let id = catId + "." + config.CONTENT[i].projects[j].id;

                orbit = [orbits[i], orbitMoon];
                startA = [startAngle[i], startAngleMoon];
                velocit = [velocities[i], velocityMoon];

                const projectBody = await createBody({ id: id, bodyType: "moon", orbit: orbit, startAngle: startA, velocities: velocit });
                loop.updatables.push(projectBody);
                scene.add(projectBody);
            }
        }
    }

    // for apps that update occasionally
    render() {
        renderer.render(scene, camera);
    }

    // for apps with constant animation
    start() {
        loop.start();
        isRunning = true;
    }

    stop() {
        loop.stop();
        isRunning = false;
    }

    isRunning() {
        return isRunning;
    }

    onMouseDown(evt: MouseEvent) {
        // Check if any of the objects in the scene have been clicked
        const mouse = new Vector2();
        mouse.x = (evt.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(evt.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);

        const intersects = raycaster.intersectObjects(scene.children, true);

        if (intersects.length === 0) return;
        for (const intersect of intersects) {
            let id = intersect.object.name;

            if (id !== "sun" && currentFocus == id) {
                currentFocus = id;
                if (categoryIds.includes(id)) {
                    let parentObject = scene.getObjectByName("sun");
                    if (parentObject === undefined) break;
                    camera.setFocusObject(parentObject, config.DISTANCE_SUN);
                    controls.setTargetObject(parentObject);
                } else {
                    // Find parent Object3D  id is "category.project"
                    let parent = id.split(".")[0];
                    let parentObject = scene.getObjectByName(parent);
                    if (parentObject === undefined) break;
                    camera.setFocusObject(parentObject, config.DISTANCE_PLANET);
                    controls.setTargetObject(parentObject);
                }
            } else {
                currentFocus = id;
                if (currentFocus === "sun") {
                    camera.setFocusObject(intersect.object, config.DISTANCE_SUN);
                } else {
                    camera.setFocusObject(intersect.object, config.DISTANCE_PLANET);
                }
                controls.setTargetObject(intersect.object);
            }
            break;
        }
    }
}

export { World };
