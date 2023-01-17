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

// High performance (not mobile)
const sunMaterial = new MeshBasicMaterial({ color: config.COLOR_SUN });
const planetMaterial = new MeshStandardMaterial({ color: config.COLOR_PLANET });
const moonMaterial = new MeshStandardMaterial({ color: config.COLOR_MOON });

// Fast (mobile)
const planetMaterialFast = new MeshBasicMaterial({ color: config.COLOR_PLANET });
const moonMaterialFast = new MeshBasicMaterial({ color: config.COLOR_MOON });

const sphereGeometry = new SphereGeometry(1, 32, 16);
const sphereGeometryFast = new SphereGeometry(1, 16, 12);

function createBody(body: Body, isMobile: boolean): Mesh {
    // Create the bodies basend on their type
    let radius: number = 0;

    let sphere: Mesh;

    if (body.bodyType == "sun") {
        radius = config.RADIUS_SUN;
        sphere = new Mesh(sphereGeometry, sunMaterial);
    } else if (body.bodyType == "planet") {
        radius = config.RADIUS_PLANET[0] + Math.random() * (config.RADIUS_PLANET[1] - config.RADIUS_PLANET[0]);
        if (isMobile){
            sphere = new Mesh(sphereGeometryFast, planetMaterialFast);
        } else {
            sphere = new Mesh(sphereGeometry, planetMaterial);
        }
    } else {
        radius = config.RADIUS_MOON[0] + Math.random() * (config.RADIUS_MOON[1] - config.RADIUS_MOON[0]);
        if (isMobile){
            sphere = new Mesh(sphereGeometryFast, moonMaterialFast);
        } else {
            sphere = new Mesh(sphereGeometryFast, moonMaterial);
        }
    }

    // Scale the mesh
    sphere.scale.set(radius, radius, radius);
    sphere.name = body.id;

    if (body.bodyType !== 'sun' && !isMobile) {
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