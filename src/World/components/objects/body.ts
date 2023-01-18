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

const sunMaterial = new MeshBasicMaterial({ color: config.COLOR_SUN });
const sunGeometry = new SphereGeometry(1, 32, 16);

// Change material and geometry based on performance (mobile has simpler shapes and no lighting)
let planetMaterial: MeshStandardMaterial | MeshBasicMaterial;
let moonMaterial: MeshStandardMaterial | MeshBasicMaterial;
let planetGeometry: SphereGeometry;
let moonGeometry: SphereGeometry;
if (!isMobile) {
    planetMaterial = new MeshStandardMaterial({ color: config.COLOR_PLANET });
    moonMaterial = new MeshStandardMaterial({ color: config.COLOR_MOON });
    planetGeometry = new SphereGeometry(1, 32, 16);
    moonGeometry = new SphereGeometry(1, 32, 16);
} else {
    planetMaterial = new MeshBasicMaterial({ color: config.COLOR_PLANET });
    moonMaterial = new MeshBasicMaterial({ color: config.COLOR_MOON });
    planetGeometry = new SphereGeometry(1, 16, 12);
    moonGeometry = new SphereGeometry(1, 12, 8);
}

function createBody(body: Body): Mesh {
    // Create the bodies basend on their type
    let radius: number = 0;

    let sphere: Mesh;

    if (body.bodyType == "sun") {
        radius = config.RADIUS_SUN;
        sphere = new Mesh(sunGeometry, sunMaterial);
    } else if (body.bodyType == "planet") {
        radius = config.RADIUS_PLANET[0] + Math.random() * (config.RADIUS_PLANET[1] - config.RADIUS_PLANET[0]);
        sphere = new Mesh(planetGeometry, planetMaterial);
    } else {
        radius = config.RADIUS_MOON[0] + Math.random() * (config.RADIUS_MOON[1] - config.RADIUS_MOON[0]);
        sphere = new Mesh(moonGeometry, moonMaterial);
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