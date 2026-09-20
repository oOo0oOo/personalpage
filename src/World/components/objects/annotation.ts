import { Object3D } from 'three';

import { camera } from "../../World";

// Cached scene container geometry. Reading it every frame for every annotation
// would force a layout, so it is cached and refreshed on resize instead.
let centerY = 0;
let sceneLeft = 0;
let sceneTop = 0;
let sceneWidth = 0;
let sceneHeight = 0;

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
    static pendingUpdates: (() => void)[] = [];
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

        // Rotate the line upwards if not down
        if (this.lineUp) {
            // Rotate around origin (30 pixels up)
            this.lineElement.style.transformOrigin = '0 -20px';
            this.lineElement.style.transform = 'rotate(180deg)';
        }

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
      
        // Perform all calculations without touching the DOM
        let screenPos = this.targetBody.position.clone().project(camera);
        let x = sceneLeft + (screenPos.x + 1) / 2 * sceneWidth;
        let y = sceneTop + (-1 * screenPos.y + 1) / 2 * sceneHeight;
        let yDiff = y - this.yPos;
      
        // Determine if we need to switch the label orientation
        if ((yDiff < 0) !== this.lineUp) {
            this.lineUp = !this.lineUp;
        }
        yDiff = Math.abs(yDiff);
        yDiff -= this.lineUp ? 20 : 60;
      
        // Collect style updates without applying them yet
        Annotation.pendingUpdates.push(() => {
            this.domElement.style.transform = `translate3d(${x}px,0,0)`;
            this.lineElement.style.cssText = `
                transform-origin: ${this.lineUp ? '0 -20px' : '0 0'};
                transform: ${this.lineUp ? 'rotate(180deg)' : ''};
                height: ${yDiff}px;
            `;
        });
    }

    static applyPendingUpdates() {
        Annotation.pendingUpdates.forEach(update => update());
        Annotation.pendingUpdates = [];
    }

}