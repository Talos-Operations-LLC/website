import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import * as rotation from '../public/assets/js/globe-rotation.js';

const source = (await readFile(process.env.HERO_SOURCE || new URL('../public/assets/js/hero.js', import.meta.url), 'utf8'))
  .replace(/^import .*\n/, '');

async function setup() {
  let time = 1000, nextFrame, camera, dots = [];
  const element = () => ({
    style: {}, dataset: {}, hidden: false, listeners: {},
    addEventListener(type, fn) { this.listeners[type] = fn; },
    setAttribute() {},
  });
  const map = { ...element(), clientWidth: 1000, clientHeight: 470 };
  const context = new Proxy({}, {
    get: (_, key) => key === 'clearRect' ? () => { dots = []; }
      : key === 'drawImage' ? (_sprite, x, y, width) => { dots.push([x + width / 2, y + width / 2]); }
      : () => ({ addColorStop() {} }),
    set: () => true,
  });
  const canvas = {
    ...element(), parentElement: map,
    getContext: type => type === 'webgl' ? null : context,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 1600, height: 940 }),
    setPointerCapture() {}, releasePointerCapture() {},
  };
  const elements = { field: canvas };
  vm.runInNewContext(source, {
    ...rotation, Math: Object.assign(Object.create(Math), { random: () => .5 }),
    matrix(q, out) { camera = [...q]; return rotation.matrix(q, out); },
    document: {
      getElementById: id => elements[id],
      querySelector: selector => selector === '.map' ? map : null,
      createElement: () => ({ getContext: () => context }),
    },
    fetch: async () => ({ ok: true, json: async () => ({
      world: [0, 0, 0, 300, 300, 0, -900, 300],
      us: [-12400, 2500, -6700, 2500, -12400, 4900, -6700, 4900], ws: 1, uss: 1,
    }) }),
    matchMedia: () => ({ matches: false }), innerWidth: 1440, devicePixelRatio: 1,
    performance: { now: () => time }, addEventListener() {}, console,
    requestAnimationFrame: fn => { nextFrame = fn; },
  });
  await new Promise(setImmediate);
  function advance(ms = 16) {
    const end = time + ms;
    while (time < end) { time = Math.min(end, time + 16); nextFrame(time); }
  }
  function pointer(type, x = 800, y = 470, pointerType = 'mouse') {
    canvas.listeners[type]({ type, pointerId: 1, pointerType, button: 0,
      clientX: x, clientY: y, timeStamp: time, preventDefault() {} });
  }
  advance();
  return { canvas, map, advance, pointer, camera: () => camera, dots: () => dots,
    explore: () => { pointer('pointerdown'); pointer('pointerup'); } };
}

const difference = (a, b) => 2 * Math.acos(Math.min(1, Math.abs(a.reduce((sum, value, i) => sum + value * b[i], 0))));

test('Direct dragging works without a button, including outside the rim', async () => {
  const h = await setup();
  h.explore();
  h.pointer('pointerdown', 1150);
  h.advance();
  assert.equal(h.canvas.style.cursor, 'grabbing');
  const before = h.camera();
  h.pointer('pointermove', 1190);
  h.advance();
  assert.ok(difference(before, h.camera()) > .2);
});

test('grabbing during the early zoom transfers control to the hand', async () => {
  const h = await setup();
  h.advance(6350);
  h.pointer('pointerdown');
  h.advance();
  const before = h.camera();
  h.pointer('pointermove', 870);
  h.advance(400);
  assert.equal(h.canvas.style.cursor, 'grabbing');
  assert.ok(difference(before, h.camera()) > .3);
  const held = h.camera();
  h.advance(1000);
  assert.ok(difference(held, h.camera()) < 1e-6, 'the tour must not overwrite a held orientation');
});

test('a duplicate pointer move does not kill a flick; holding before release does', async () => {
  const h = await setup();
  h.explore(); h.advance(1200); h.pointer('pointerdown');
  for (let i = 1; i <= 8; i++) { h.advance(); h.pointer('pointermove', 800 + i * 8); }
  h.pointer('pointermove', 864);
  h.pointer('pointerup', 864);
  h.advance();
  const released = h.camera();
  h.advance(200);
  assert.ok(difference(released, h.camera()) > .1, 'a flick should coast after release');
  h.pointer('pointerdown'); h.advance(); h.pointer('pointermove', 850);
  h.advance(150); h.pointer('pointerup', 850);
  const stopped = h.camera(); h.advance(200);
  assert.ok(difference(stopped, h.camera()) < 1e-6, 'holding the globe should stop momentum');
});

test('cancelled pointer capture releases the globe without a fling', async () => {
  const h = await setup();
  h.explore(); h.advance(1200); h.pointer('pointerdown');
  h.advance(); h.pointer('pointermove', 890); h.advance(); h.pointer('pointercancel');
  const before = h.camera(); h.advance(200);
  assert.equal(h.canvas.style.cursor, 'grab');
  assert.ok(difference(before, h.camera()) < 1e-6);
});

test('a short quick flick carries at least as far as the old globe', async () => {
  const h = await setup();
  h.explore(); h.advance(); h.pointer('pointerdown');
  h.advance(8); h.pointer('pointermove', 810); h.pointer('pointerup', 810);
  h.advance();
  const released = h.camera(); h.advance(200);
  const oldVelocity = 10 / (470 * .46) / .008 * .6;
  const oldCoast = oldVelocity * (1 - Math.exp(-2.2 * .2)) / 2.2;
  assert.ok(difference(released, h.camera()) >= oldCoast, 'small flicks must not lose the old momentum');
});

test('hover pushes globe particles and leaving lets them spring back', async () => {
  const h = await setup(), untouched = await setup();
  h.explore(); untouched.explore(); h.advance(); untouched.advance();
  const [x, y] = h.dots()[0];
  h.pointer('pointermove', x + 12, y);
  h.advance(250); untouched.advance(250);
  const displacement = () => Math.hypot(h.dots()[0][0] - untouched.dots()[0][0], h.dots()[0][1] - untouched.dots()[0][1]);
  assert.ok(displacement() > 5, 'hover must visibly push particles on the globe');
  h.pointer('pointerleave'); h.advance(1800); untouched.advance(1800);
  assert.ok(displacement() < .2, 'particles must settle back after hover');
});

test('tour resumes after inactivity but never while the globe is held', async () => {
  const h = await setup(); h.explore(); h.advance(400);
  h.pointer('pointerdown'); h.advance(12000);
  assert.equal(h.map.dataset.exploring, 'true');
  h.pointer('pointerup'); h.advance(9000);
  assert.equal(h.map.dataset.exploring, 'true');
  h.advance(1100);
  assert.equal(h.map.dataset.exploring, 'false');
});

test('touch can grab directly without an activation button', async () => {
  const h = await setup();
  h.pointer('pointerdown', 800, 470, 'touch'); h.advance();
  assert.equal(h.canvas.style.cursor, 'grabbing');
  const before = h.camera();
  h.pointer('pointermove', 850, 470, 'touch'); h.advance();
  assert.ok(difference(before, h.camera()) > .2);
});
