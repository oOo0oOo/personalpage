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
import { createRenderer } from './systems/renderer';
import { createCircle } from './components/objects/circle';
import { Loop } from './systems/Loop';
import { Resizer } from './systems/Resizer';
import { FocusCamera } from './components/camera';
import { FocusControls } from './systems/controls';
import { Annotation } from './components/objects/annotation';
import { config, isMobile } from '../main';


export let camera: FocusCamera;
let scene: Scene;
let renderer: WebGLRenderer | WebGL1Renderer;
let controls: FocusControls;
let loop: Loop;
let isRunning: boolean;
let raycaster: Raycaster;
let currentFocus: string = "sun";
let categoryIds: string[];
let annotations: Annotation[];
let centerLabel: HTMLDivElement;
let infoBox: HTMLDivElement;
let infoTitle: HTMLDivElement;
let infoDescription: HTMLDivElement;
let infoLink: HTMLDivElement;
let infoMedia: HTMLDivElement;
let infoExtras: HTMLDivElement;
let technologyTemplates: Map<string, HTMLDivElement>;


class World {
    constructor(container: HTMLCanvasElement) {
        camera = createCamera();
        raycaster = new Raycaster();
        scene = createScene({ backgroundColor: config.COLOR_BACKGROUND });
        renderer = createRenderer();
        controls = createControls({ camera: camera, canvas: renderer.domElement });
        loop = new Loop({ camera, scene, renderer });
        loop.updatables.push(controls);
        loop.updatables.push(camera);
        container.append(renderer.domElement);

        if (!isMobile) {
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
        infoExtras = document.getElementById("info_extras") as HTMLDivElement;

        // Create all technologies from templates
        technologyTemplates = new Map();
        for (let i = 0; i < config.TECHNOLOGIES.length; i++) {
            let tech = config.TECHNOLOGIES[i];
            let template = document.getElementById("tech_" + tech.id) as HTMLDivElement;
            technologyTemplates.set(tech.id, template);
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

        camera.setStartDistance();

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
                orbitMoon += 2 * Math.random() * config.ORBIT_MOON_RANDOM - config.ORBIT_MOON_RANDOM;
                let startAngleMoon: number = 2 * Math.PI * Math.random();
                let velocityMoon: number = -1 * Math.sqrt(config.GRAVITY / orbitMoon);
                let id = catId + "_" + config.CONTENT[i].projects[j].id;

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

        // Create annotations (we will alter them later)
        // The y position of the annotations alternates between the ANNOTATION_Y_OFFSETS
        annotations = [];
        let y_offset = 0;
        for (let i = 0; i < maxProjects; i++) {
            var extra = config.ANNOTATION_Y_STEP * Math.floor(i / 2);
            if (i % 2 != 0) {
                extra *= -1;
            }
            let yPos = config.ANNOTATION_Y_OFFSETS[y_offset] + extra;
            y_offset = (y_offset + 1) % config.ANNOTATION_Y_OFFSETS.length;
            let annotation = new Annotation(yPos);
            loop.updatables.push(annotation);
            annotations.push(annotation);
        }
    }

    render() {
        renderer.render(scene, camera);
    }

    start() {
        loop.start();
        this.updateAnnotations();
        isRunning = true;
    }

    stop() {
        loop.stop();
        isRunning = false;
    }

    isRunning() {
        return isRunning;
    }

    onMouseDown(evt: MouseEvent | TouchEvent) {
        // If controls disabled (looking at project) do nothing
        if (!controls.enabled) return;

        // Check if any of the objects in the scene have been clicked
        const mouse = new Vector2();

        if (evt instanceof MouseEvent) {
            mouse.x = (evt.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(evt.clientY / window.innerHeight) * 2 + 1;
        } else {
            mouse.x = (evt.touches[0].clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(evt.touches[0].clientY / window.innerHeight) * 2 + 1;
        }

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
        this.updateAnnotations();
    }

    updateAnnotations() {
        // If sun is currentFocus: Annotate all categories
        if (currentFocus === "sun") {
            for (let i = 0; i < annotations.length; i++) {
                if (i < config.CONTENT.length) {
                    let title = config.CONTENT[i].title;
                    let id = config.CONTENT[i].id;
                    let obj = scene.getObjectByName(id);
                    if (obj === undefined) break;
                    annotations[i].setTargetBody(obj, title, id);
                } else {
                    // Hide unused annotations
                    annotations[i].hideAnnotation();
                }
            }
            // Hide center label div and info box
            centerLabel.style.opacity = "0";
            infoBox.style.opacity = "0";
            infoBox.style.display = "none";
        }
        // If a category is currentFocus: Annotate all projects
        else if (categoryIds.includes(currentFocus)) {

            let index = categoryIds.indexOf(currentFocus);

            // Fade in label using a css transition
            centerLabel.style.opacity = "1";
            centerLabel.innerHTML = config.CONTENT[index].title;

            // Hide info box
            infoBox.style.opacity = "0";
            infoBox.style.display = "none";

            for (let i = 0; i < annotations.length; i++) {
                if (i < config.CONTENT[index].projects.length) {
                    let title = config.CONTENT[index].projects[i].title;
                    let projectId = currentFocus + "_" + config.CONTENT[index].projects[i].id;
                    let obj = scene.getObjectByName(projectId);
                    if (obj === undefined) break;
                    annotations[i].setTargetBody(obj, title, projectId);
                } else {
                    // Hide unused annotations
                    annotations[i].hideAnnotation();
                }
            }
        }
        // If a project is currentFocus: Annotate only this project
        else {
            centerLabel.style.opacity = "0";

            // Show info box
            // let info = this.getProjectInfo(currentFocus);
            this.showInfoBox(currentFocus);

            // Hide all annotations
            for (let i = 0; i < annotations.length; i++) {
                annotations[i].hideAnnotation();
            }
        }
    }

    showInfoBox(projectId: string) {
        let project = this.getProject(projectId);

        if (project === undefined) return;

        infoTitle.innerHTML = project.title;
        infoDescription.innerHTML = project.description;

        // Show or hide link button
        if (project.link) {
            infoLink.innerHTML = project.link.text;
            // Set link onclick this div
            infoLink.onclick = () => {
                window.open(project?.link?.url, "_blank");
            }
            infoLink.style.display = "block";
        } else {
            infoLink.style.display = "none";
        }

        // Show media
        if (project.media) {
            infoMedia.style.display = "flex 1 1 0px";

            let type = project.media.type;
            let url = project.media.url;

            let str: string = "";
            if (type === "img") {
                str = `<img class="media-img" src="static/media/${url}">`;
            } else if (type === "video") {
                str = `<video controls class="media-video"><source src="static/media/${url}" type="video/mp4"></video>`;
            } else if (type === "audio") {
                str = `<audio controls class="media-audio"><source src="static/media/${url}" type="audio/mpeg"></audio>`;
            }
            infoMedia.innerHTML = str;
        } else {
            infoMedia.style.display = "none";
        }

        // Remove all previous divs in #info_technologies
        let infoTechnologies = document.getElementById("info_technologies");
        if (infoTechnologies !== null) {
            while (infoTechnologies.firstChild) {
                infoTechnologies.removeChild(infoTechnologies.firstChild);
            }
        }

        // Add technologies
        if (project.technologies) {
            for (let i = 0; i < project.technologies.length; i++) {
                // @ts-ignore
                let templ = technologyTemplates.get(project.technologies[i])?.cloneNode(true);

                // @ts-ignore
                infoTechnologies.appendChild(templ);
            };

            // Show infoTechnologies div
            // @ts-ignore
            infoExtras.style.display = "block";
        } else {
            // Hide infoTechnologies div
            // @ts-ignore
            infoExtras.style.display = "none";
        }


        // Show the highlights as a <ul>
        let highlights = document.getElementById("info_highlights");
        if (highlights !== null && project.highlights) {
            let str = "<ul>";
            for (let i = 0; i < project.highlights.length; i++) {
                str += `<li>${project.highlights[i]}</li>`;
            }
            str += "</ul>";
            highlights.innerHTML = str;
            highlights.style.display = "block";
        } else if (highlights !== null) {
            highlights.style.display = "none";
        }

        infoBox.style.opacity = "1";
        infoBox.style.display = "block";
    }

    hideInfoBox() {
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
        } else if (categoryIds.includes(id)) {
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
        if (currentFocus !== "sun") {
            window.location.hash = currentFocus;
        } else {
            window.location.hash = "";
        }

        this.updateAnnotations();
    }

    onDrag() {
        // If current focus is the sun, stop auto move
        if (currentFocus === "sun") {
            camera.doAutoMove = false;
        }
    }

    onScroll() {
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

    getProject(id: string) {
        id = id.split("_")[1];
        // Find the project with the given id
        let info: (string | undefined)[] = [];
        for (let i = 0; i < config.CONTENT.length; i++) {
            for (let j = 0; j < config.CONTENT[i].projects.length; j++) {
                if (config.CONTENT[i].projects[j].id === id) {
                    let project = config.CONTENT[i].projects[j];
                    return project;
                }
            }
        }
    }
}
export { World };
