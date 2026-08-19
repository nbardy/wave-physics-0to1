export function vec3(x = 0, y = 0, z = 0) {
  return [x, y, z];
}

export function add3(a, b) {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

export function sub3(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

export function scale3(a, scalar) {
  return [a[0] * scalar, a[1] * scalar, a[2] * scalar];
}

export function dot3(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

export function cross3(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

export function length3(a) {
  return Math.hypot(a[0], a[1], a[2]);
}

export function normalize3(a) {
  const length = length3(a);
  return length < 1e-12 ? [0, 0, 0] : scale3(a, 1 / length);
}

export function average3(points) {
  if (points.length === 0) return [0, 0, 0];
  const sum = points.reduce((acc, point) => add3(acc, point), [0, 0, 0]);
  return scale3(sum, 1 / points.length);
}

export function identity4() {
  return new Float32Array([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1,
  ]);
}

export function multiply4(a, b) {
  const out = new Float32Array(16);
  for (let column = 0; column < 4; column += 1) {
    for (let row = 0; row < 4; row += 1) {
      out[column * 4 + row] =
        a[0 * 4 + row] * b[column * 4 + 0]
        + a[1 * 4 + row] * b[column * 4 + 1]
        + a[2 * 4 + row] * b[column * 4 + 2]
        + a[3 * 4 + row] * b[column * 4 + 3];
    }
  }
  return out;
}

export function perspective4(fovY, aspect, near, far) {
  const f = 1 / Math.tan(fovY / 2);
  const out = new Float32Array(16);
  out[0] = f / aspect;
  out[5] = f;
  out[10] = far / (near - far);
  out[11] = -1;
  out[14] = (far * near) / (near - far);
  return out;
}

export function ortho4(left, right, bottom, top, near = -10, far = 10) {
  const out = identity4();
  out[0] = 2 / (right - left);
  out[5] = 2 / (top - bottom);
  out[10] = 1 / (near - far);
  out[12] = (left + right) / (left - right);
  out[13] = (top + bottom) / (bottom - top);
  out[14] = near / (near - far);
  return out;
}

export function lookAt4(eye, target, up = [0, 1, 0]) {
  const z = normalize3(sub3(eye, target));
  let x = normalize3(cross3(up, z));
  if (length3(x) < 1e-8) x = [1, 0, 0];
  const y = cross3(z, x);

  const out = identity4();
  out[0] = x[0]; out[1] = y[0]; out[2] = z[0];
  out[4] = x[1]; out[5] = y[1]; out[6] = z[1];
  out[8] = x[2]; out[9] = y[2]; out[10] = z[2];
  out[12] = -dot3(x, eye);
  out[13] = -dot3(y, eye);
  out[14] = -dot3(z, eye);
  return out;
}

export function translation4(x, y, z) {
  const out = identity4();
  out[12] = x;
  out[13] = y;
  out[14] = z;
  return out;
}

export function scale4(x, y, z) {
  const out = identity4();
  out[0] = x;
  out[5] = y;
  out[10] = z;
  return out;
}

export function rotationX4(angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return new Float32Array([
    1, 0, 0, 0,
    0, c, s, 0,
    0, -s, c, 0,
    0, 0, 0, 1,
  ]);
}

export function rotationY4(angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return new Float32Array([
    c, 0, -s, 0,
    0, 1, 0, 0,
    s, 0, c, 0,
    0, 0, 0, 1,
  ]);
}

export function transformPoint4(matrix, point, w = 1) {
  const x = point[0];
  const y = point[1];
  const z = point[2];
  return [
    matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12] * w,
    matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13] * w,
    matrix[2] * x + matrix[6] * y + matrix[10] * z + matrix[14] * w,
    matrix[3] * x + matrix[7] * y + matrix[11] * z + matrix[15] * w,
  ];
}

export function projectToCanvas(point, mvp, width, height) {
  const clip = transformPoint4(mvp, point, 1);
  const w = Math.abs(clip[3]) < 1e-10 ? 1e-10 : clip[3];
  const ndcX = clip[0] / w;
  const ndcY = clip[1] / w;
  const ndcZ = clip[2] / w;
  return {
    x: (ndcX * 0.5 + 0.5) * width,
    y: (1 - (ndcY * 0.5 + 0.5)) * height,
    depth: ndcZ,
    visible: w > 0 && ndcZ >= -0.2 && ndcZ <= 1.2,
  };
}

export function orbitCamera(yaw, pitch, distance, target = [0, 0, 0]) {
  const cp = Math.cos(pitch);
  const eye = [
    target[0] + distance * cp * Math.sin(yaw),
    target[1] + distance * Math.sin(pitch),
    target[2] + distance * cp * Math.cos(yaw),
  ];
  const forward = normalize3(sub3(target, eye));
  const right = normalize3(cross3(forward, [0, 1, 0]));
  const up = normalize3(cross3(right, forward));
  return { eye, target, forward, right, up, view: lookAt4(eye, target, [0, 1, 0]) };
}
