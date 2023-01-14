
// import * as THREE from 'https://unpkg.com/three@0.148.0/build/three.module.js';
// import { OrbitControls } from 'https://unpkg.com/three@0.148.0/examples/jsm/controls/OrbitControls.js';

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import {CONFIG} from './config.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

// const controls = new OrbitControls( camera, renderer.domElement );

function create_body(body_config, orbit) {
    var radius_range;
    var color;
    var scaled_orbit;
    if (body_config.parent) {
        radius_range = CONFIG.RADIUS_MOON;
        color = CONFIG.COLOR_MOON;
        scaled_orbit = CONFIG.SCALE_MOON_ORBIT * (0.2 + 0.8 * orbit);
    } else {
        radius_range = CONFIG.RADIUS_PLANET;
        color = CONFIG.COLOR_PLANET;
        scaled_orbit = CONFIG.SCALE_PLANET_ORBIT * (0.2 + 0.8 * orbit);
    }

    var radius = radius_range[0] + Math.random() * (radius_range[1] - radius_range[0]);
    const geometry = new THREE.SphereGeometry(radius, 16, 16);
    const material = new THREE.MeshBasicMaterial({color: color});
    const body = new THREE.Mesh(geometry, material);
    body.name = body_config.id;
    scene.add( body );


    var body_config = {
        body: body,
        config: body_config,
        orbit: scaled_orbit,
        angular_velocity: Math.sqrt(1 / scaled_orbit),
        angle: 2 * Math.PI * Math.random(),
    };

    return body_config;
}

// POPULATE THE SCENE

// Create the sun
const geometry = new THREE.SphereGeometry(CONFIG.RADIUS_SUN, 16, 16);
const material = new THREE.MeshBasicMaterial({color: CONFIG.COLOR_SUN});
const body = new THREE.Mesh(geometry, material);
body.name = "sun";
scene.add( body );

// Create all the categories
var categories = {};
var orbits = {};
CONFIG.categories.forEach(function(body_config, index) {
    var orbit = index / CONFIG.categories.length;
    console.log(orbit);
    categories[body_config.id] = create_body(body_config, orbit);
    orbits[body_config.id] = [];
});

// Create all projects
CONFIG.projects.forEach(function(body_config) {
    orbits[body_config.parent].push(body_config.id);
});

var projects = {};
CONFIG.projects.forEach(function(body_config) {
    var orbit = orbits[body_config.parent].indexOf(body_config.id);
    orbit /= orbits[body_config.parent].length;
    projects[body_config.id] = create_body(body_config, orbit);
});

camera.position.z = 5;

function update() {
    requestAnimationFrame( update );

    // Update all planet positions
    Object.values(categories).forEach(function(body_config) {
        body_config.angle += body_config.angular_velocity;
        body_config.body.position.x = body_config.orbit * Math.cos(body_config.angle) * 2;
        body_config.body.position.z = body_config.orbit * Math.sin(body_config.angle) * 2;
    });

    renderer.render( scene, camera );
};

update();