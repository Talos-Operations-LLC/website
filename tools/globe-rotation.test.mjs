import test from 'node:test';
import assert from 'node:assert/strict';
import { normalize, multiply, axisAngle, fromCamera, arcball, between, dragRotation, slerp, matrix } from '../public/assets/js/globe-rotation.js';

const near = (actual, expected, tolerance = 1e-9) => assert.ok(Math.abs(actual - expected) < tolerance, `${actual} != ${expected}`);
function rotate(q, point) {
  const m = matrix(q, new Float64Array(9));
  return [0, 3, 6].map(i => m[i] * point[0] + m[i + 1] * point[1] + m[i + 2] * point[2]);
}

test('camera quaternion preserves the existing USA landing projection', () => {
  const lon = -98.2 * Math.PI / 180, lat = 38.8 * Math.PI / 180;
  for (const point of [[1, 0, 0], [0, 1, 0], [0, 0, 1], [.3, .4, .5]]) {
    const [px, py, pz] = point;
    const t = px * Math.cos(lon) + pz * Math.sin(lon);
    const expected = [pz * Math.cos(lon) - px * Math.sin(lon), Math.cos(lat) * py - Math.sin(lat) * t, Math.sin(lat) * py + Math.cos(lat) * t];
    rotate(fromCamera(-98.2, 38.8), [pz, py, px]).forEach((value, i) => near(value, expected[i]));
  }
});

test('trackball rotation follows the grab point and supports roll', () => {
  const from = arcball(.72, 0), to = arcball(0, .72);
  const q = between(from, to);
  rotate(q, from).forEach((value, i) => near(value, to[i]));
  assert.ok(Math.abs(q[2]) > .1, 'drag around the rim must rotate around the screen axis');
});

test('can flip beyond the old tilt limit and complete a full rotation', () => {
  const flipped = rotate(axisAngle(1, 0, 0, Math.PI), [0, 1, 0]);
  near(flipped[1], -1);
  const original = rotate(axisAngle(1, 0, 0, Math.PI * 2), [0, 1, 0]);
  near(original[1], 1);
});

test('zero movement and opposite vectors never produce NaN', () => {
  const p = arcball(0, 0);
  assert.deepEqual(between(p, p), [0, 0, 0, 1]);
  const opposite = between([1, 0, 0], [-1, 0, 0]);
  rotate(opposite, [1, 0, 0]).forEach((value, i) => near(value, [-1, 0, 0][i]));
  assert.ok(arcball(100, -100).every(Number.isFinite));
});

test('repeated arbitrary drags stay normalized with no scale drift', () => {
  let q = fromCamera(-58, 16);
  for (let i = 0; i < 5000; i++) q = multiply(axisAngle(Math.sin(i), Math.cos(i), .3, .013), q);
  near(Math.hypot(...q), 1);
  near(Math.hypot(...rotate(q, [0, 0, 1])), 1);
});

test('tour interpolation lands exactly and takes the short quaternion path', () => {
  const from = normalize([.7, -.3, .2, .1]), to = fromCamera(-98.2, 38.8);
  rotate(slerp(from, to, 1), [0, 0, 1]).forEach((value, i) => near(value, rotate(to, [0, 0, 1])[i]));
  const midpoint = slerp(to, to.map(value => -value), .5);
  rotate(midpoint, [1, 0, 0]).forEach((value, i) => near(value, rotate(to, [1, 0, 0])[i]));
});

test('equal swipes turn equally far at the center, rim, and beyond the globe', () => {
  const angles = [0, 180, 350, 700].map(x => {
    const q = dragRotation(x, 0, x + 40, 0, 200);
    return 2 * Math.acos(q[3]);
  });
  angles.forEach(angle => near(angle, .28));
});

test('drag reversal cancels cleanly and rim gestures retain free roll', () => {
  const forward = dragRotation(140, 50, 180, 120, 200);
  const reverse = dragRotation(180, 120, 140, 50, 200);
  near(multiply(reverse, forward)[3], 1);
  assert.ok(Math.abs(forward[2]) > .02);
  assert.deepEqual(dragRotation(10, 10, 10, 10, 200), [0, 0, 0, 1]);
});
