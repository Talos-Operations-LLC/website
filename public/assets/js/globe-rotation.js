export function normalize(q) {
  const length = Math.hypot(...q);
  return length > 1e-12 ? q.map(value => value / length) : [0, 0, 0, 1];
}

export function multiply(a, b) {
  return normalize([
    a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
    a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
    a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
    a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2],
  ]);
}

export function axisAngle(x, y, z, angle) {
  const length = Math.hypot(x, y, z);
  if (length < 1e-12) return [0, 0, 0, 1];
  const scale = Math.sin(angle / 2) / length;
  return [x * scale, y * scale, z * scale, Math.cos(angle / 2)];
}

export function fromCamera(longitude, latitude) {
  const radians = Math.PI / 180;
  return multiply(axisAngle(1, 0, 0, latitude * radians), axisAngle(0, 1, 0, -longitude * radians));
}

export function dragRotation(fromX, fromY, toX, toY, radius) {
  const dx = toX - fromX, dy = toY - fromY;
  const distance = Math.hypot(dx, dy);
  if (!distance) return [0, 0, 0, 1];
  const x = (fromX + toX) / 2, y = (fromY + toY) / 2;
  const rim = Math.max(radius, Math.hypot(x, y));
  const roll = (y * dx - x * dy) / rim * 0.75;
  return axisAngle(dy, dx, roll, distance / radius * 1.4);
}

export function arcball(x, y) {
  const radiusSquared = x * x + y * y;
  const z = radiusSquared <= 0.5 ? Math.sqrt(1 - radiusSquared) : 0.5 / Math.sqrt(radiusSquared);
  const length = Math.hypot(x, y, z);
  return [x / length, y / length, z / length];
}

export function between(a, b) {
  const dot = Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
  if (dot < -0.999999) {
    return Math.abs(a[0]) < 0.9
      ? axisAngle(0, a[2], -a[1], Math.PI)
      : axisAngle(-a[2], 0, a[0], Math.PI);
  }
  return normalize([
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
    1 + dot,
  ]);
}

export function slerp(a, b, amount) {
  let dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
  const sign = dot < 0 ? -1 : 1;
  dot = Math.min(1, Math.abs(dot));
  if (dot > 0.9995) return normalize(a.map((value, i) => value + (b[i] * sign - value) * amount));
  const angle = Math.acos(dot), divisor = Math.sin(angle);
  const left = Math.sin((1 - amount) * angle) / divisor;
  const right = Math.sin(amount * angle) / divisor * sign;
  return a.map((value, i) => value * left + b[i] * right);
}

export function matrix(q, out) {
  const [x, y, z, w] = q;
  out[0] = 1 - 2 * (y * y + z * z); out[1] = 2 * (x * y - z * w); out[2] = 2 * (x * z + y * w);
  out[3] = 2 * (x * y + z * w); out[4] = 1 - 2 * (x * x + z * z); out[5] = 2 * (y * z - x * w);
  out[6] = 2 * (x * z - y * w); out[7] = 2 * (y * z + x * w); out[8] = 1 - 2 * (x * x + y * y);
  return out;
}
