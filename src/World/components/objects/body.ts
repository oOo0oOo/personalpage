import {
    BoxGeometry,
    MathUtils,
    Mesh,
    MeshBasicMaterial,
    MeshStandardMaterial,
    SphereGeometry,
    Texture,
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


// function create_body(body_config, orbit) {
//     var radius_range;
//     var color;
//     var scaled_orbit;
//     orbit += Math.random() * 2 * CONFIG.ORBIT_RANDOM - CONFIG.ORBIT_RANDOM;

//     if (body_config.parent) {
//         radius_range = CONFIG.RADIUS_MOON;
//         color = CONFIG.COLOR_MOON;
//         scaled_orbit = CONFIG.SCALE_MOON_ORBIT * (0.3 + 0.7 * orbit);
//     } else {
//         radius_range = CONFIG.RADIUS_PLANET;
//         color = CONFIG.COLOR_PLANET;
//         scaled_orbit = CONFIG.SCALE_PLANET_ORBIT * (0.2 + 0.8 * orbit);
//     }

//     var radius = radius_range[0] + Math.random() * (radius_range[1] - radius_range[0]);
//     const geometry = new THREE.SphereGeometry(radius, 16, 16);
//     const material = new THREE.MeshBasicMaterial({ color: color });
//     const body = new THREE.Mesh(geometry, material);
//     body.name = body_config.id;
//     scene.add(body);

//     if (body_config.parent == null) {
//         // Create trailing curve for the body
//         var curve = new THREE.EllipseCurve(
//             0, 0,            // ax, aY
//             scaled_orbit, scaled_orbit,           // xRadius, yRadius
//             0, 2 * Math.PI,  // aStartAngle, aEndAngle
//             false,            // aClockwise
//             0                 // aRotation
//         );

//         const num_points = 50 + Math.floor(orbit * 50);
//         const points = curve.getPoints(num_points);

//         // Convert 2D points to 3D points with z = y
//         for (var i = 0; i < points.length; i++) {
//             points[i].z = points[i].y;
//             points[i].y = 0;
//         }

//         const geometryCurve = new THREE.BufferGeometry().setFromPoints(points);
//         const materialCurve = new THREE.LineBasicMaterial({ color: CONFIG.COLOR_ORBIT });

//         // Create the final object to add to the scene
//         const ellipse = new THREE.Line(geometryCurve, materialCurve);

//         scene.add(ellipse);
//     };

//     var body_config = {
//         body: body,
//         curve: curve,
//         config: body_config,
//         orbit: scaled_orbit,
//         angular_velocity: Math.sqrt(CONFIG.GRAVITY / scaled_orbit),
//         angle: 2 * Math.PI * Math.random(),
//     };

//     return body_config;
// };