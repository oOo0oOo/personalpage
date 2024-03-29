import { Object3D } from 'three';

import { camera } from "../../World";

let centerY = window.innerHeight / 2;

// Get dimensions of scene container
let sceneLeft = document.querySelector('#scene_container')?.getBoundingClientRect().left || 0;
let sceneTop = document.querySelector('#scene_container')?.getBoundingClientRect().top || 0;
let sceneWidth = document.querySelector('#scene_container')?.clientWidth || 0;
let sceneHeight = document.querySelector('#scene_container')?.clientHeight || 0;

export class Annotation {
    domElement: HTMLDivElement;
    titleElement: HTMLDivElement;
    targetBody: Object3D;
    lineElement: HTMLDivElement;
    visible = false;
    yPos: number;
    lineUp: boolean;
    labelDown: boolean;

    constructor(yPos: number) {
        this.targetBody = new Object3D();

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
    }

    setTargetBody(body: Object3D, title: string, id: string) {
        this.targetBody = body;
        this.titleElement.innerHTML = title;
        // Save id in data attribute
        this.titleElement.dataset.id = id;
        this.domElement.style.display = 'block';
        this.visible = true;
    }

    hideAnnotation() {
        this.domElement.style.display = 'none';
        this.visible = false;
    }

    tick(elapsedTime: number) {
        if (this.visible) {
            // Set CSS pos
            let screenPos = this.targetBody.position.clone().project(camera);
            let x = sceneLeft + (screenPos.x + 1) / 2 * sceneWidth;
            this.domElement.style.left = `${x}px`;

            // Check the y distance between the label and the body
            let y = sceneTop + (-1 * screenPos.y + 1) / 2 * sceneHeight;
            let yDiff = y - this.yPos;

            // We might switch the label from up to down or vice versa
            if (yDiff < 0 != this.lineUp) {
                this.lineUp = !this.lineUp;

                if (this.lineUp) {
                    this.lineElement.style.transformOrigin = '0 -20px';
                    this.lineElement.style.transform = 'rotate(180deg)';
                } else {
                    this.lineElement.style.transformOrigin = '0 0';
                    this.lineElement.style.transform = '';
                }
            }

            yDiff = Math.abs(yDiff);
            if (this.lineUp){
                yDiff -= 20;
            } else {
                yDiff -= 60;
            }
            this.lineElement.style.height = `${yDiff}px`;
        }
    }
}