import { Object3D, Vector3 } from 'three';

import { camera } from "../../World";

// Cached scene container geometry. Reading it every frame for every annotation
// would force a layout, so it is cached and refreshed on resize instead.
let centerY = 0;
let sceneLeft = 0;
let sceneTop = 0;
let sceneWidth = 0;
let sceneHeight = 0;

const projected = new Vector3();

export class Annotation {
    domElement: HTMLDivElement;
    titleElement: HTMLDivElement;
    targetBody: Object3D;
    lineElement: HTMLDivElement;
    visible = false;
    yPos: number;
    offsetY: number;
    lineUp: boolean;
    labelDown: boolean;
    lastTransform = '';
    lastLineTransform = '';
    static pending: Annotation[] = [];
    static instances: Annotation[] = [];

    // Re-read the container geometry and re-anchor every annotation to the new
    // viewport centre. Called once at startup and on every resize.
    static refreshViewport() {
        const container = document.querySelector('#scene_container');
        const rect = container?.getBoundingClientRect();

        centerY = window.innerHeight / 2;
        sceneLeft = rect?.left || 0;
        sceneTop = rect?.top || 0;
        sceneWidth = container?.clientWidth || 0;
        sceneHeight = container?.clientHeight || 0;

        for (const annotation of Annotation.instances) {
            annotation.yPos = centerY + annotation.offsetY;
            annotation.domElement.style.top = `${annotation.yPos}px`;
        }
    }

    constructor(yPos: number) {
        // Make sure the cached geometry is populated before we position anything
        if (sceneWidth === 0) Annotation.refreshViewport();

        this.targetBody = new Object3D();
        this.offsetY = yPos;

        this.labelDown = yPos > 0;
        this.lineUp = this.labelDown;

        // Copy element from contents of #template_annotation, only use innerHTML
        this.domElement = document.querySelector('#annotation_template')?.cloneNode(true) as HTMLDivElement;
        this.domElement.id = '';
        this.titleElement = this.domElement.querySelector('#annotation_title') as HTMLDivElement;
        this.lineElement = this.domElement.querySelector('#annotation_line') as HTMLDivElement;

        // Add to DOM
        document.querySelector('#overlay')?.append(this.domElement);

        // Set height via css pos
        this.yPos = centerY + yPos;
        this.domElement.style.top = `${this.yPos}px`;

        // Keyboard reachable: these labels are how you navigate the site
        this.titleElement.setAttribute('role', 'link');
        this.titleElement.setAttribute('tabindex', '0');

        // Registered last, so refreshViewport() never sees a half-built instance
        Annotation.instances.push(this);
    }

    setTargetBody(body: Object3D, title: string, id: string) {
        this.targetBody = body;
        this.titleElement.innerHTML = title;
        // Save id in data attribute
        this.titleElement.dataset.id = id;
        this.titleElement.setAttribute('tabindex', '0');
        this.domElement.style.display = 'block';
        this.visible = true;
    }

    hideAnnotation() {
        this.domElement.style.display = 'none';
        // A hidden label must not stay in the tab order
        this.titleElement.setAttribute('tabindex', '-1');
        this.visible = false;
    }

    tick(elapsedTime: number) {
        if (!this.visible) return;

        // Project into a scratch vector instead of cloning every frame
        let screenPos = projected.copy(this.targetBody.position).project(camera);
        let x = sceneLeft + (screenPos.x + 1) / 2 * sceneWidth;
        let y = sceneTop + (-1 * screenPos.y + 1) / 2 * sceneHeight;
        let yDiff = y - this.yPos;

        this.lineUp = yDiff < 0;
        let length = Math.max(0, Math.abs(yDiff) - (this.lineUp ? 20 : 60));

        // The line is a 1px element stretched with a transform. Setting its
        // height instead forces a layout every frame, which Firefox felt most.
        // Pointing up mirrors it about y = -20px, as rotate(180deg) did.
        let transform = `translate3d(${x.toFixed(1)}px,0,0)`;
        let lineTransform = this.lineUp
            ? `translateY(-40px) scale(-1,${(-length).toFixed(1)})`
            : `scale(1,${length.toFixed(1)})`;

        // Collect style updates without applying them yet, and skip unchanged ones
        if (transform !== this.lastTransform || lineTransform !== this.lastLineTransform) {
            this.lastTransform = transform;
            this.lastLineTransform = lineTransform;
            Annotation.pending.push(this);
        }
    }

    static applyPendingUpdates() {
        for (const annotation of Annotation.pending) {
            annotation.domElement.style.transform = annotation.lastTransform;
            annotation.lineElement.style.transform = annotation.lastLineTransform;
        }
        Annotation.pending.length = 0;
    }

}