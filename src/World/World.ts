import {
    Raycaster,
    Scene,
    WebGL1Renderer,
    WebGLRenderer,
    Vector2,
    Object3D,
    Plane,
    Vector3,
} from 'three';

import { createCamera } from './components/camera';
import { createLights } from './components/lights';
import { createBody } from './components/objects/body';
import { createComet } from './components/objects/comet';
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
import { randFloat } from 'three/src/math/MathUtils';


const FADEOUT = "fadeout 0.2s ease-in-out 1 forwards";
const FADEIN = "fadein 3s ease-in-out 1 forwards";
const FADEINFAST = "fadein 1.5s ease-in-out 1 forwards";


export let camera: FocusCamera;
let scene: Scene;
let renderer: WebGLRenderer | WebGL1Renderer;
let controls: FocusControls;
let loop: Loop;
let isRunning: boolean;
let raycaster: Raycaster;
let currentFocus: string = "";
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
        // loop.updatables.push(sun);
        loop.attracting.push(sun);
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
            loop.attracting.push(categoryBody);
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

                if (!isMobile) {
                    loop.attracting.push(projectBody);
                }
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
        // The y position of the annotations alternates
        let perSide = Math.floor(maxProjects / 2);
        let annotationY = [];

        for (let i = 0; i < perSide; i++) {
            annotationY.push(-config.ANNOTATION_Y_OFFSET - config.ANNOTATION_Y_STEP * i);
        }
        annotationY.reverse();
        for (let i = 0; i < perSide; i++) {
            annotationY.push(config.ANNOTATION_Y_OFFSET + config.ANNOTATION_Y_STEP * i);
        }

        annotations = [];
        for (let i = 0; i < maxProjects; i++) {
            let annotation = new Annotation(annotationY[i]);
            loop.updatables.push(annotation);
            annotations.push(annotation);
        }

        this.changeCurrentFocus("sun");
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

        let foundIntersect = false;

        for (const intersect of intersects) {
            let id = intersect.object.name;
            if (id === "") continue;

            let sameId = id === currentFocus;

            if (currentFocus !== "sun" && sameId) {
                if (categoryIds.includes(currentFocus)) {
                    this.changeCurrentFocus("sun");
                } else {
                    // Find parent Object3D  id is "category.project"
                    let parent = id.split("_")[0];
                    this.changeCurrentFocus(parent);
                }
            } else {
                this.changeCurrentFocus(id);
            }
            foundIntersect = true;
            break;
        }
        this.updateAnnotations();

        // Spawn some comets
        if (!foundIntersect) {
            // Intersect click with solar system plane y=0
            const plane = new Plane(new Vector3(0, 1, 0), 0);
            const ray = new Raycaster();
            ray.setFromCamera(mouse, camera);
            const point = new Vector3();
            ray.ray.intersectPlane(plane, point);

            // Check if point is in solar system (largest orbit)
            if (point.length() > 30) return;

            // Spawn comet with random velocity with random sign
            const randFloat = () => (0.5 + 0.5 * Math.random());

            let numComets = 12;
            if (isMobile) numComets = 3;

            for (let i = 0; i < numComets; i++) {
                let velocity = new Vector3(randFloat(), 0, 0);
                velocity.applyAxisAngle(new Vector3(0, 1, 0), 4 * Math.random() * Math.PI);
                let comet = createComet({ position: point, velocity: velocity });
                scene.add(comet);
                loop.updatables.push(comet);

                // Remove comet after 10 seconds
                setTimeout(() => {
                    scene.remove(comet);
                    loop.updatables.splice(loop.updatables.indexOf(comet), 1);
                }, Math.random() * 4000 + 10000);
            }
        }
    }

    updateAnnotations() {
        // If sun is currentFocus: Annotate all categories
        if (currentFocus === "sun") {

            let numCategories = config.CONTENT.length;
            let startIndex = Math.floor((annotations.length / 2) - (numCategories / 2));

            for (let i = 0; i < numCategories; i++) {
                let title = config.CONTENT[i].title;
                let id = config.CONTENT[i].id;
                let obj = scene.getObjectByName(id);
                if (obj === undefined) break;
                annotations[i + startIndex].setTargetBody(obj, title, id);
            }

            // Hide unused annotations
            for (let i = 0; i < startIndex; i++) {
                annotations[i].hideAnnotation();
            }
            for (let i = startIndex + numCategories; i < annotations.length; i++) {
                annotations[i].hideAnnotation();
            }

            // Hide center label div and info box
            centerLabel.style.animation = FADEOUT;
            infoBox.style.display = "none";
        }
        // If a category is currentFocus: Annotate all projects
        else if (categoryIds.includes(currentFocus)) {

            let index = categoryIds.indexOf(currentFocus);

            // Fade in label using a css transition
            centerLabel.style.animation = FADEIN;
            centerLabel.innerHTML = config.CONTENT[index].title;

            // Hide info box
            infoBox.style.display = "none";

            let numProjects = config.CONTENT[index].projects.length;
            let startIndex = Math.floor((annotations.length / 2) - (numProjects / 2));

            for (let i = 0; i < numProjects; i++) {
                let title = config.CONTENT[index].projects[i].title;
                let projectId = currentFocus + "_" + config.CONTENT[index].projects[i].id;
                let obj = scene.getObjectByName(projectId);
                if (obj === undefined) break;
                annotations[i + startIndex].setTargetBody(obj, title, projectId);
            }

            // Hide unused annotations
            for (let i = 0; i < startIndex; i++) {
                annotations[i].hideAnnotation();
            }
            for (let i = startIndex + numProjects; i < annotations.length; i++) {
                annotations[i].hideAnnotation();
            }
        }
        // If a project is currentFocus: Annotate only this project
        else {
            centerLabel.style.animation = FADEOUT;

            // Show info box
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

        infoBox.style.display = "block";
        infoBox.style.animation = FADEINFAST;
    }

    hideInfoBox() {
        // Hide info box and focus on the parent object
        infoBox.style.opacity = "0";
        let parent = currentFocus.split("_")[0];
        this.changeCurrentFocus(parent);
    }

    changeCurrentFocus(newFocus: string) {
        if (newFocus === currentFocus) return;

        currentFocus = newFocus;

        if (currentFocus === "sun") {
            camera.setFocusSun();
            controls.setTargetObject(new Object3D());
            controls.enabled = true;
        } else {
            let cam: number[] = [];
            if (categoryIds.includes(currentFocus)) {
                controls.enabled = true;
                if (isMobile) {
                    cam = config.CAMERA_PLANET_MOBILE;
                } else {
                    cam = config.CAMERA_PLANET;
                }
            } else {
                if (isMobile) {
                    cam = config.CAMERA_MOON_MOBILE;
                } else {
                    cam = config.CAMERA_MOON;
                }
                controls.enabled = false;
            }
            let focusObject = scene.getObjectByName(currentFocus);
            if (focusObject !== undefined) {
                camera.setFocusObject(focusObject, cam[0], cam[1]);
                controls.setTargetObject(focusObject);
            }
        }

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
