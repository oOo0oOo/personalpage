import {
    Mesh,
    MeshBasicMaterial,
    MeshStandardMaterial,
    SphereGeometry,
} from 'three';

import { config } from "../../../main";

interface Body {
    id: string;
    bodyType: 'sun' | 'planet' | 'moon';
    orbit?: number[];
    startAngle?: number[];
    parent?: string;
    velocities?: number[];
}

function createMaterial(body: Body) {
    let bodyType = body.bodyType;
    let color: string;

    if (bodyType === 'sun') {
        color = config.COLOR_SUN;
    } else if (bodyType === 'planet') {
        color = config.COLOR_PLANET;
    } else if (bodyType === 'moon') {
        color = config.COLOR_MOON;
    } else {
        throw new Error(`Bad type! Use 'sun', 'planet' or 'moon'.`);
    }

    if (bodyType === 'sun') {
        // Sun has to be transparent to light
        return new MeshBasicMaterial({ color: color });
    } else {
        return new MeshStandardMaterial({ color: color });
    }
}

function createBody(body: Body): Mesh {
    // Create the bodies basend on their type
    let radius: number = 0;

    if (body.bodyType == "sun") {
        radius = config.RADIUS_SUN;
    } else if (body.bodyType == "planet") {
        radius = config.RADIUS_PLANET[0] + Math.random() * (config.RADIUS_PLANET[1] - config.RADIUS_PLANET[0]);
    } else if (body.bodyType == "moon") {
        radius = config.RADIUS_MOON[0] + Math.random() * (config.RADIUS_MOON[1] - config.RADIUS_MOON[0]);
    }

    const geometry = new SphereGeometry(radius, 32, 16);
    const material = createMaterial(body);
    const sphere = new Mesh(geometry, material);
    sphere.name = body.id;

    if (body.bodyType !== 'sun' && config.SHADOWS) {
        sphere.castShadow = true;
        sphere.receiveShadow = true;
    }

    // @ts-ignore
    sphere.tick = (elapsedTime: number) => {
        if (body.orbit && body.startAngle && body.velocities) {
            let x: number = 0;
            let z: number = 0;
            // Calculate the new position based on the elapsed time
            for (let i = 0; i < body.orbit.length; i++) {
                x += body.orbit[i] * Math.cos(body.velocities[i] * elapsedTime + body.startAngle[i]);
                z += body.orbit[i] * Math.sin(body.velocities[i] * elapsedTime + body.startAngle[i]);
            }
            sphere.position.set(x, 0, z);
        };
    }

    return sphere;
}

export { createBody };