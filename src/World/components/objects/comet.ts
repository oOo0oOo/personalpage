import {
    Mesh,
    MeshBasicMaterial,
    MeshStandardMaterial,
    SphereGeometry,
    Vector3,
} from 'three';

import { config, isMobile } from "../../../main";

interface Comet {
    position: Vector3;
    velocity: Vector3;
}

// Change geometry based on performance (mobile has simpler shapes and no lighting)
let material = new MeshBasicMaterial({ color: config.COLOR_COMET });

function createComet(comet: Comet): Mesh {
    // Scale the mesh
    const geometry = new SphereGeometry(config.RADIUS_COMET, 8, 6);
    const sphere = new Mesh(geometry, material);

    sphere.position.x = comet.position.x;
    sphere.position.z = comet.position.z;

    const factor = (4 / 3) * Math.PI;
    // @ts-ignore
    sphere.tick = (elapsedTime: number, delta: number, attractPositions: Vector3[], attractRadii: number[]) => {
        // Calculate overall gravity
        let force = new Vector3();
        let collision = false;
        for (let i = 0; i < attractPositions.length; i++) {
            let radius = attractRadii[i];
            let attractor = attractPositions[i];
            let dx = attractor.x - sphere.position.x;
            let dz = attractor.z - sphere.position.z;
            let distance = Math.sqrt(dx * dx + dz * dz);

            // Check for collision
            if (distance < radius) {
                collision = true;
                break
            }

            // Mass is dependent on the radius of the sphere 
            let mass = factor * Math.pow(radius, 2.5);  // Make them more equal instead of **3 for prop
            let f = (config.GRAVITY_COMET * mass) / (distance * distance);
            let direction = new Vector3(dx, 0, dz);
            direction.normalize();
            direction.multiplyScalar(f);

            force.add(direction);
        }

        // Delete the comet if it collides
        if (collision) {
            if (sphere.parent) {
                sphere.parent.remove(sphere);
            }
        }

        // Update velocity
        comet.velocity.x += force.x * delta;
        comet.velocity.z += force.z * delta;

        // Update position
        sphere.position.x += comet.velocity.x * delta;
        sphere.position.z += comet.velocity.z * delta;
    }
    return sphere;
}

export { createComet };