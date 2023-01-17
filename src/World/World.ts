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

import { Label } from './components/objects/label';
import { createCircle } from './components/objects/circle';

import { config } from '../main';

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
let isMobile: boolean;

class World {
    constructor(container: HTMLCanvasElement) {
        // Mobile: 
        // Camera sun position is further away to show everything
        // No lights and shadows to improve performance
        isMobile = window.innerWidth < 768 || window.innerHeight < 768;

        camera = createCamera(isMobile);
        raycaster = new Raycaster();
        currentFocus = "sun";

        /**
         * Set the scene's background color to the same as the container's
         * background color in index.css to prevent flashing on load
         * (src/styles/index.css #scene_container)
         */
        scene = createScene({ backgroundColor: config.COLOR_BACKGROUND });
        renderer = createRenderer(isMobile);
        controls = createControls({ camera: camera, canvas: renderer.domElement });
        loop = new Loop({ camera, scene, renderer });
        loop.updatables.push(controls);
        loop.updatables.push(camera);
        container.append(renderer.domElement);

        if (!isMobile){
            const { sunLight, ambientLight } = createLights();
            scene.add(sunLight, ambientLight);
        }

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
        const sun = await createBody({ bodyType: "sun", id: "sun" }, isMobile);
        controls.target.copy(sun.position);
        loop.updatables.push(sun);
        scene.add(sun);

        // Pick orbits and angles for all categories
        let orbits: number[] = [];
        let startAngle: number[] = [];
        let velocities: number[] = [];

        for (let i = 0; i < config.CONTENT.length; i++) {
            var orbit = config.SCALE_PLANET_ORBIT * (0.2 + 0.8 * (i / config.CONTENT.length));
            orbit += 2 * Math.random() * config.ORBIT_PLANET_RANDOM - config.ORBIT_PLANET_RANDOM;
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
            const categoryBody = await createBody({ id: catId, bodyType: "planet", orbit: orbit, startAngle: startA, velocities: velocit }, isMobile);
            loop.updatables.push(categoryBody);
            scene.add(categoryBody);

            // Create all projects as moons of the planet
            let numMoons = config.CONTENT[i].projects.length;
            for (let j = 0; j < config.CONTENT[i].projects.length; j++) {
                let orbitMoon: number = config.SCALE_MOON_ORBIT * (0.25 + 0.75 * (j / numMoons));
                orbitMoon += 2 * Math.random() * config.ORBIT_MOON_RANDOM - config.ORBIT_MOON_RANDOM;
                let startAngleMoon: number = 2 * Math.PI * Math.random();
                let velocityMoon: number = -1 * Math.sqrt(config.GRAVITY / orbitMoon);
                let id = catId + "_" + config.CONTENT[i].projects[j].id;

                orbit = [orbits[i], orbitMoon];
                startA = [startAngle[i], startAngleMoon];
                velocit = [velocities[i], velocityMoon];

                const projectBody = await createBody({ id: id, bodyType: "moon", orbit: orbit, startAngle: startA, velocities: velocit }, isMobile);
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
            let label = new Label(yPos);
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
        // If controls disabled (looking at project) do nothing
        if (!controls.enabled) return;

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
                    this.changeCurrentFocus("sun");
                } else {
                    // Find parent Object3D  id is "category.project"
                    let parent = id.split("_")[0];
                    this.changeCurrentFocus(parent);
                }
            } else {
                this.changeCurrentFocus(currentFocus);
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
                    let id = config.CONTENT[i].id;
                    let obj = scene.getObjectByName(id);
                    if (obj === undefined) break;
                    labels[i].setTargetBody(obj, title, id);
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
                    let projectId = currentFocus + "_" + config.CONTENT[index].projects[i].id;
                    let obj = scene.getObjectByName(projectId);
                    if (obj === undefined) break;
                    labels[i].setTargetBody(obj, title, projectId);
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
            let info = this.getProjectInfo(currentFocus);
            this.showInfoBox(info);

            for (let i = 0; i < labels.length; i++) {
                // Hide unused labels
                labels[i].hideAnnotation();
            }
        }
    }

    showInfoBox(info: (string|undefined)[]){
        if (info[0]){
            infoTitle.innerHTML = info[0];
        }
        if (info[1]){
            infoDescription.innerHTML = info[1];
        }

        // Show or hide link button
        if (info[2] && info[3]){
            infoLink.innerHTML = info[3];
            // Set link onclick this div
            infoLink.onclick = () => {
                window.open(info[2], "_blank");
            }
            infoLink.style.display = "block";
        } else {
            infoLink.style.display = "none";
        }

        // Show media
        if (info[4] && info[5]){
            infoMedia.style.display = "block";

            let str: string = "";
            if (info[4] === "img"){
                str = `<img class="media-img" src="public/media/${info[5]}">`;
            } else if (info[4] === "video"){
                str = `<video controls class="media-video"><source src="public/media/${info[5]}" type="video/mp4"></video>`;
            } else if (info[4] === "audio"){
                str = `<audio controls class="media-audio"><source src="public/media/${info[5]}" type="audio/mpeg"></audio>`;
            }
            infoMedia.innerHTML = str;
        } else {
            infoMedia.style.display = "none";
        }

        infoBox.style.opacity = "1";
        infoBox.style.display = "block";
    }

    hideInfoBox(){
        // Hide info box and focus on the parent object
        infoBox.style.opacity = "0";
        let parent = currentFocus.split("_")[0];
        this.changeCurrentFocus(parent);
    }

    changeCurrentFocus(id: string) {
        currentFocus = id;

        let distance;
        let height;
        if (id === "sun") {
            distance = 0;
            height = config.HEIGHT_SUN;
            controls.enabled = true;
        } else if(categoryIds.includes(id)){
            distance = config.DISTANCE_PLANET;
            height = config.HEIGHT_PLANET;
            controls.enabled = true;
        } else {
            distance = config.DISTANCE_MOON;
            height = config.HEIGHT_MOON;
            // Disable orbit controls
            controls.enabled = false;
        }

        let focusObject = scene.getObjectByName(currentFocus);
        if (focusObject === undefined) return;
        camera.setFocusObject(focusObject, distance, height);
        controls.setTargetObject(focusObject);

        // Set hash url
        if (currentFocus !== "sun"){
            window.location.hash = currentFocus;
        } else {
            window.location.hash = "";
        }

        this.updateLabels();
    }

    onDrag(){
        // If current focus is the sun, stop auto move
        if (currentFocus === "sun"){
            camera.doAutoMove = false;
        }
    }

    onScroll(){
        camera.doAutoMove = false;
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

    getProjectInfo(id: string): (string|undefined)[] {
        id = id.split("_")[1];
        // Find the project with the given id
        let info: (string|undefined)[] = [];
        for (let i = 0; i < config.CONTENT.length; i++) {
            for (let j = 0; j < config.CONTENT[i].projects.length; j++) {
                if (config.CONTENT[i].projects[j].id === id) {
                    let project = config.CONTENT[i].projects[j];
                    let link = project.link?.url;
                    let linkText = project.link?.text;
                    let mediaType = project.media?.type;
                    let mediaUrl = project.media?.url;

                    info = [project.title, project.description, link, linkText, mediaType, mediaUrl];
                }
            }
        }
        return info;
    }
}
export { World };
