import {
    Mesh,
    MeshBasicMaterial,
    MeshStandardMaterial,
    SphereGeometry,
} from 'three';

import { config, isMobile } from "../../../main";

interface Body {
    id: string;
    bodyType: 'sun' | 'planet' | 'moon';
    orbit?: number[];
    startAngle?: number[];
    parent?: string;
    velocities?: number[];
}

// Change geometry based on performance (mobile has simpler shapes and no lighting)
const sunGeometry = new SphereGeometry(1, 32, 16);
let planetGeometry: SphereGeometry;
let moonGeometry: SphereGeometry;
if (!isMobile) {
    planetGeometry = new SphereGeometry(1, 32, 16);
    moonGeometry = new SphereGeometry(1, 32, 16);
} else {
    planetGeometry = new SphereGeometry(1, 16, 12);
    moonGeometry = new SphereGeometry(1, 12, 8);
}

// Materials are immutable here, so build them once and share them across bodies.
const sunMaterial = new MeshBasicMaterial({ color: config.COLOR_SUN });

const bodyMaterials: (MeshStandardMaterial | MeshBasicMaterial)[] = config.COLOR_BODIES.map(
    (color) => isMobile
        ? new MeshBasicMaterial({ color: color })
        : new MeshStandardMaterial({ color: color })
);

function createBody(body: Body): Mesh {
    // Create the bodies basend on their type
    let radius: number = 0;

    let sphere: Mesh;

    let sphereMaterial: MeshStandardMaterial | MeshBasicMaterial;

    if (body.bodyType == "sun") {
        sphereMaterial = sunMaterial;
    } else {
        // Bodies only differ by colour, so share one material per palette entry.
        // ~50 bodies drawn with 18 materials instead of 50 cuts GPU state changes.
        let index = Math.floor(Math.random() * bodyMaterials.length);
        sphereMaterial = bodyMaterials[index];
    }

    if (body.bodyType == "sun") {
        radius = config.RADIUS_SUN;
        sphere = new Mesh(sunGeometry, sphereMaterial);
    } else if (body.bodyType == "planet") {
        radius = config.RADIUS_PLANET[0] + Math.random() * (config.RADIUS_PLANET[1] - config.RADIUS_PLANET[0]);
        sphere = new Mesh(planetGeometry, sphereMaterial);
    } else {
        radius = config.RADIUS_MOON[0] + Math.random() * (config.RADIUS_MOON[1] - config.RADIUS_MOON[0]);
        sphere = new Mesh(moonGeometry, sphereMaterial);
    }

    // Scale the mesh
    sphere.scale.set(radius, radius, radius);
    sphere.name = body.id;
    sphere.userData = { radius: radius };

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