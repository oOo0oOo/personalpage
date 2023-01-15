import {
    OrthographicCamera,
    PerspectiveCamera,
    Raycaster,
    Scene,
    WebGL1Renderer,
    WebGLRenderer,
    Vector2
} from 'three';

import { createCamera } from './components/camera';
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
import { Label } from './components/objects/label';

/**
 * If two instances of the World class are created, the second instance will
 * overwrite the module scoped variables below from the first instance.
 * Accordingly, only one World class should be used at a time.
 */
export let camera: FocusCamera;
let scene: Scene;
let renderer: WebGLRenderer | WebGL1Renderer;
let controls: FocusControls;
let loop: Loop;
let isRunning: boolean;
let raycaster: Raycaster;
let currentFocus: string;
let categoryIds: string[];
let labels: Label[];

class World {
    constructor(container: HTMLCanvasElement) {
        camera = createCamera();
        raycaster = new Raycaster();
        currentFocus = "sun";

        /**
         * Set the scene's background color to the same as the container's
         * background color in index.css to prevent flashing on load
         * (src/styles/index.css #scene_container)
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

        // Find the maximal number of projects in a category
        let maxProjects = 0;
        for (let i = 0; i < config.CONTENT.length; i++) {
            if (config.CONTENT[i].projects.length > maxProjects) {
                maxProjects = config.CONTENT[i].projects.length;
            }
        }

        maxProjects = Math.max(maxProjects + 1, config.CONTENT.length);

        // Create labels (we will alter them later)
        // The y position of the labels alternates between the LABEL_Y_OFFSETS
        labels = [];
        let label_y_offset = 0;
        for (let i = 0; i < maxProjects; i++) {
            var extra = config.LABEL_Y_STEP * Math.floor(i / 2);
            if (i % 2 != 0) {
                extra *= -1;
            }
            let yPos = config.LABEL_Y_OFFSETS[label_y_offset] + extra;
            label_y_offset = (label_y_offset + 1) % config.LABEL_Y_OFFSETS.length;
            let label = new Label(yPos, i % 2 == 0);
            loop.updatables.push(label);
            labels.push(label);
        }
    }

    // for apps that update occasionally
    render() {
        renderer.render(scene, camera);
    }

    // for apps with constant animation
    start() {
        loop.start();
        this.updateLabels();
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
                if (categoryIds.includes(id)) {
                    let parentObject = scene.getObjectByName("sun");
                    if (parentObject === undefined) break;
                    camera.setFocusObject(parentObject, config.DISTANCE_SUN);
                    controls.setTargetObject(parentObject);
                    currentFocus = "sun";
                } else {
                    // Find parent Object3D  id is "category.project"
                    let parent = id.split(".")[0];
                    let parentObject = scene.getObjectByName(parent);
                    if (parentObject === undefined) break;
                    camera.setFocusObject(parentObject, config.DISTANCE_PLANET);
                    controls.setTargetObject(parentObject);
                    currentFocus = parent;
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
        this.updateLabels();
    }

    updateLabels() {
        // If sun is currentFocus: label all categories
        if (currentFocus === "sun") {
            for (let i = 0; i < labels.length; i++) {
                if (i < config.CONTENT.length) {
                    let title = config.CONTENT[i].title;
                    let obj = scene.getObjectByName(config.CONTENT[i].id);
                    if (obj === undefined) break;
                    labels[i].setTargetBody(obj, title);
                } else {
                    // Hide unused labels
                    labels[i].hideAnnotation();
                }
            }
        }
        // If a category is currentFocus: label all projects
        else if (categoryIds.includes(currentFocus)) {

            // label the category
            let title = currentFocus;
            let obj = scene.getObjectByName(currentFocus);
            // @ts-ignore
            labels[0].setTargetBody(obj, title);

            let index = categoryIds.indexOf(currentFocus);
            for (let i = 0; i < labels.length - 1; i++) {
                if (i < config.CONTENT[index].projects.length) {
                    let title = config.CONTENT[index].projects[i].title;
                    let obj = scene.getObjectByName(currentFocus + "." + config.CONTENT[index].projects[i].id);
                    if (obj === undefined) break;
                    labels[i + 1].setTargetBody(obj, title);
                } else {
                    // Hide unused labels
                    labels[i + 1].hideAnnotation();
                }
            }
        }
        // If a project is currentFocus: label only this project
        else {
            for (let i = 0; i < labels.length; i++) {
                if (i === 0) {
                    let title = currentFocus.split(".")[1];
                    // Capitalize first letter
                    title = title.charAt(0).toUpperCase() + title.slice(1);

                    let obj = scene.getObjectByName(currentFocus);
                    if (obj === undefined) break;
                    labels[i].setTargetBody(obj, title);
                } else {
                    // Hide unused labels
                    labels[i].hideAnnotation();
                }
            }
        }
    }
}
export { World };
