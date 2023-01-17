import {
    EllipseCurve,
    Line,
    LineBasicMaterial,
    BufferGeometry,
    Vector3
} from 'three';

import { config } from "../../../main";

const materialCurve = new LineBasicMaterial({ color: config.COLOR_ORBIT, linewidth: 0.5 });

function createCircle(radius: number): Line {
    // Create trailing curve for the body
    var curve = new EllipseCurve(
        0, 0,            // ax, aY
        radius, radius,           // xRadius, yRadius
        0, 2 * Math.PI,  // aStartAngle, aEndAngle
        false,            // aClockwise
        0                 // aRotation
    );

    const num_points = 50 + Math.floor(radius * 20);
    const points = curve.getPoints(num_points);

    // Convert 2D points to 3D points with z = y
    let points3D = [];
    for (let i = 0; i < points.length; i++) {
        points3D.push(new Vector3(points[i].x, 0, points[i].y));
    }

    const geometryCurve = new BufferGeometry().setFromPoints(points3D);
    const ellipse = new Line(geometryCurve, materialCurve);

    return ellipse;
}

export { createCircle };