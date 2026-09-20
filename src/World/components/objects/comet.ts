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

// Create comet materials (from colors)
const materials: MeshBasicMaterial[] = []
for (let i = 0; i < config.COLOR_COMETS.length; i++) {
    let color = config.COLOR_COMETS[i];
    materials.push(new MeshBasicMaterial({ color: color }));
}

function createComet(comet: Comet): Mesh {
    // Scale the mesh
    const geometry = new SphereGeometry(config.RADIUS_COMET * (0.7 + Math.random() * 0.4), 8, 6);
    const material = materials[Math.floor(Math.random() * materials.length)];
    const sphere = new Mesh(geometry, material);

    sphere.position.x = comet.position.x;
    sphere.position.z = comet.position.z;

    const factor = (4 / 3) * Math.PI;

    // Mass only depends on the attractor radius, which never changes, so the
    // per-attractor masses are computed once on the first tick and reused.
    let masses: number[] | null = null;

    // Removing the mesh from the scene does not take the comet out of the
    // Loop's updatables, so remember that it is gone and stop integrating.
    let dead = false;

    // @ts-ignore
    sphere.tick = (elapsedTime: number, delta: number, attractPositions: Vector3[], attractRadii: number[]) => {
        if (dead) return;

        if (masses === null) {
            // Exponent 2.5 rather than 3 keeps the bodies closer in mass
            masses = attractRadii.map((radius) => factor * Math.pow(radius, 2.5));
        }

        // The simulation is flat (y is always 0), so accumulate the force into
        // two scalars instead of allocating Vector3s every frame for every comet.
        let forceX = 0;
        let forceZ = 0;
        let collision = false;

        for (let i = 0; i < attractPositions.length; i++) {
            let radius = attractRadii[i];
            let attractor = attractPositions[i];
            let dx = attractor.x - sphere.position.x;
            let dz = attractor.z - sphere.position.z;
            let distanceSq = dx * dx + dz * dz;

            // Check for collision
            if (distanceSq < radius * radius) {
                collision = true;
                break
            }

            // f / distance folds the normalisation of (dx, dz) into the magnitude,
            // so this is one sqrt per attractor instead of a normalize() call.
            let distance = Math.sqrt(distanceSq);
            let f = (config.GRAVITY_COMET * masses[i]) / (distanceSq * distance);

            forceX += dx * f;
            forceZ += dz * f;
        }

        // Delete the comet if it collides
        if (collision) {
            dead = true;
            if (sphere.parent) {
                sphere.parent.remove(sphere);
            }
            return;
        }

        // Update velocity
        comet.velocity.x += forceX * delta;
        comet.velocity.z += forceZ * delta;

        // Update position
        sphere.position.x += comet.velocity.x * delta;
        sphere.position.z += comet.velocity.z * delta;
    }
    return sphere;
}

export { createComet };