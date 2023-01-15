import {
    Raycaster,
    Scene,
    WebGL1Renderer,
    WebGLRenderer,
    Vector2,
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
import { createCircle } from './components/objects/circle';

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
let centerLabel: HTMLDivElement;
let infoBox: HTMLDivElement;
let infoTitle: HTMLDivElement;
let infoDescription: HTMLDivElement;
let infoLink: HTMLDivElement;
let infoMedia: HTMLDivElement;

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

        // The center label from #center_label
        centerLabel = document.getElementById("center_label") as HTMLDivElement;
        centerLabel.style.opacity = "0";

        // The info box from #info_box
        infoBox = document.getElementById("info_box") as HTMLDivElement;
        infoBox.style.display = "none";
        infoBox.style.opacity = "0";

        // All elements of the info box
        infoTitle = document.getElementById("info_title") as HTMLDivElement;
        infoDescription = document.getElementById("info_description") as HTMLDivElement;
        infoLink = document.getElementById("info_link") as HTMLDivElement;
        infoMedia = document.getElementById("info_media") as HTMLDivElement;
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
            var velocity = -1 * Math.sqrt(config.GRAVITY / orbit);

            orbits.push(orbit);
            startAngle.push(angle);
            velocities.push(velocity);

            // Create orbit circle
            const circle = createCircle(orbit);
            scene.add(circle);
        }

        // Create all categories
        for (let i = 0; i < config.CONTENT.length; i++) {
            // Create the planet (category)
            let orbit: number[] = [orbits[i]];
            let startA: number[] = [startAngle[i]];
            let velocit: number[] = [velocities[i]];
            let catId = config.CONTENT[i].id;
            const categoryBody = await createBody({ id: catId, bodyType: "planet", orbit: orbit, startAngle: startA, velocities: velocit });
            loop.updatables.push(categoryBody);
            scene.add(categoryBody);

            // Create all projects as moons of the planet
            let numMoons = config.CONTENT[i].projects.length;
            for (let j = 0; j < config.CONTENT[i].projects.length; j++) {
                let orbitMoon: number = config.SCALE_MOON_ORBIT * (0.25 + 0.75 * (j / numMoons));
                let startAngleMoon: number = 2 * Math.PI * Math.random();
                let velocityMoon: number = -1 * Math.sqrt(config.GRAVITY / orbitMoon);
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

    render() {
        renderer.render(scene, camera);
    }

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

            if (id === "") continue;

            let sameId = id === currentFocus;
            currentFocus = id;

            if (currentFocus !== "sun" && sameId) {
                if (categoryIds.includes(currentFocus)) {
                    currentFocus = "sun";
                    let parentObject = scene.getObjectByName("sun");
                    if (parentObject === undefined) break;
                    camera.setFocusObject(parentObject, config.DISTANCE_SUN);
                    controls.setTargetObject(parentObject);
                } else {
                    // Find parent Object3D  id is "category.project"
                    let parent = id.split(".")[0];
                    currentFocus = parent;
                    let parentObject = scene.getObjectByName(parent);
                    if (parentObject === undefined) break;
                    camera.setFocusObject(parentObject, config.DISTANCE_PLANET);
                    controls.setTargetObject(parentObject);
                }
            } else {
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
            // Hide center label div and info box
            centerLabel.style.opacity = "0";
            infoBox.style.opacity = "0";
            infoBox.style.display = "none";
        }
        // If a category is currentFocus: label all projects
        else if (categoryIds.includes(currentFocus)) {

            let index = categoryIds.indexOf(currentFocus);

            // Fade in label using a css transition
            centerLabel.style.opacity = "1";
            centerLabel.innerHTML = config.CONTENT[index].title;

            // Hide info box
            infoBox.style.opacity = "0";
            infoBox.style.display = "none";

            for (let i = 0; i < labels.length; i++) {
                if (i < config.CONTENT[index].projects.length) {
                    let title = config.CONTENT[index].projects[i].title;
                    let obj = scene.getObjectByName(currentFocus + "." + config.CONTENT[index].projects[i].id);
                    if (obj === undefined) break;
                    labels[i].setTargetBody(obj, title);
                } else {
                    // Hide unused labels
                    labels[i].hideAnnotation();
                }
            }
        }
        // If a project is currentFocus: label only this project
        else {

            centerLabel.style.opacity = "0";

            // Show info box
            infoBox.style.opacity = "1";
            infoBox.style.display = "block";

            let el = currentFocus.split(".")[1];
            let info = this.getProjectInfo(el);

            infoTitle.innerHTML = info[0];
            infoDescription.innerHTML = info[1];

            for (let i = 0; i < labels.length; i++) {
                // Hide unused labels
                labels[i].hideAnnotation();
            }
        }
    }

    getCategoryInfo(id: string): string[] {
        // Find the category with the given id
        let info: string[] = [];
        for (let i = 0; i < config.CONTENT.length; i++) {
            if (config.CONTENT[i].id === id) {
                info = [config.CONTENT[i].title];
            }
        }
        return info;
    }

    getProjectInfo(id: string): string[] {
        // Find the project with the given id
        let info: string[] = [];
        for (let i = 0; i < config.CONTENT.length; i++) {
            for (let j = 0; j < config.CONTENT[i].projects.length; j++) {
                if (config.CONTENT[i].projects[j].id === id) {
                    info = [config.CONTENT[i].projects[j].title, config.CONTENT[i].projects[j].description, config.CONTENT[i].projects[j].url];
                }
            }
        }
        return info;
    }
}
export { World };
