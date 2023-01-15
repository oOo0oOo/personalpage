import {
    Object3D
} from 'three';

import { config } from "../../../main";

import { camera } from "../../World";

let centerY = window.innerHeight / 2;

export class Label {
    domElement: HTMLDivElement;
    titleElement: HTMLDivElement;
    targetBody: Object3D;
    lineElement: HTMLDivElement;
    visible = false;
    yPos: number;
    down: boolean;

    constructor(yPos: number, down: boolean) {
        this.targetBody = new Object3D();
        this.down = down;

        // Copy element from contents of #template_annotation, only use innerHTML
        this.domElement = document.querySelector('#annotation_template')?.cloneNode(true) as HTMLDivElement;
        this.domElement.id = '';
        this.titleElement = this.domElement.querySelector('#annotation_title') as HTMLDivElement;
        this.lineElement = this.domElement.querySelector('#annotation_line') as HTMLDivElement;

        // Add to DOM
        document.querySelector('#annotations')?.append(this.domElement);

        // Set height via css pos
        this.yPos = centerY + yPos;
        this.domElement.style.top = `${this.yPos}px`;

        // Rotate the line upwards if not down
        if (down) {
            console.log('rotating');
            // Rotate around origin (30 pixels up)
            this.lineElement.style.transformOrigin = '0 -30px';
            this.lineElement.style.transform = 'rotate(180deg)';
        }
    }

    setTargetBody(body: Object3D, title: string) {
        this.targetBody = body;
        this.titleElement.innerHTML = title;
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
            screenPos.y *= -1;
            let x = (screenPos.x + 1) / 2 * window.innerWidth;
            this.domElement.style.left = `${x}px`;

            // Check the y distance between the label and the body
            let y = (screenPos.y + 1) / 2 * window.innerHeight;
            let yDiff = Math.abs(y - this.yPos) - 100;
            if (this.down) {
                yDiff += 60
            }
            this.lineElement.style.height = `${yDiff}px`;
        }
    }
}