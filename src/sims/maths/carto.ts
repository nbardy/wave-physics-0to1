// Cartography kit for maths-01 "Every Map Lies" (PLAN v2 §Geometry honesty).
// Projections are closed-form charts of the unit sphere with GROUND Jacobians:
// columns are the landings of unit steps along the ground east / north — the
// only honest comparison, since a degree of longitude shrinks by cos φ.
// Tissot blobs are geodesic circles sampled ON THE SPHERE and pushed through
// the chart point by point — never an ellipse drawn from J; the ellipse must
// emerge as the circle shrinks. Area receipts are shoelace measurements of the
// drawn polygon over the true spherical cap area.

import { type Mat2, type Rect, fmt } from './lib'
import { COASTLINE, GREENLAND, type LonLat } from './geo'

export { COASTLINE, GREENLAND }
export type { LonLat }

const DEG = Math.PI / 180
export const rad = (d: number) => d * DEG

// ---------------------------------------------------------------------------
// Projections. Chart input is lon λ, lat φ in RADIANS; output map units with
// x east, y north. All are closed-form; MERC_MAX_LAT clips the poles Mercator
// cannot print (the honest reason wall maps stop around 82°).
// ---------------------------------------------------------------------------

export const MERC_MAX_LAT = rad(82)

export interface Proj {
  key: 'plate' | 'mercator' | 'sinusoidal'
  label: string
  xy(lon: number, lat: number): [number, number]
  /** exact chart inverse (all three charts are closed-form invertible) */
  inv(x: number, y: number): [number, number]
  /** columns = landings of unit ground-east and ground-north steps */
  groundJac(lon: number, lat: number): Mat2
  /** vertical extent actually printable, for fitting the world into a pane */
  latMax: number
}

export const PLATE: Proj = {
  key: 'plate',
  label: 'the naive grid',
  xy: (lon, lat) => [lon, lat],
  inv: (x, y) => [x, y],
  groundJac: (_lon, lat) => [1 / Math.cos(lat), 0, 0, 1],
  latMax: rad(84),
}

export const MERCATOR: Proj = {
  key: 'mercator',
  label: 'Mercator',
  xy(lon, lat) {
    const c = Math.max(-MERC_MAX_LAT, Math.min(MERC_MAX_LAT, lat))
    return [lon, Math.log(Math.tan(Math.PI / 4 + c / 2))]
  },
  inv: (x, y) => [x, 2 * Math.atan(Math.exp(y)) - Math.PI / 2],
  groundJac(_lon, lat) {
    const s = 1 / Math.cos(Math.max(-MERC_MAX_LAT, Math.min(MERC_MAX_LAT, lat)))
    return [s, 0, 0, s]
  },
  latMax: MERC_MAX_LAT,
}

export const SINUSOIDAL: Proj = {
  key: 'sinusoidal',
  label: 'sinusoidal (equal-area)',
  xy: (lon, lat) => [lon * Math.cos(lat), lat],
  inv: (x, y) => [Math.abs(Math.cos(y)) > 1e-9 ? x / Math.cos(y) : 0, y],
  groundJac: (lon, lat) => [1, -lon * Math.sin(lat), 0, 1],
  latMax: rad(84),
}

export const PROJS: Record<Proj['key'], Proj> = {
  plate: PLATE,
  mercator: MERCATOR,
  sinusoidal: SINUSOIDAL,
}

/** Inverse of Mercator's chart, for dragging on the hero map. */
export function mercatorInv(x: number, y: number): [number, number] {
  return [x, 2 * Math.atan(Math.exp(y)) - Math.PI / 2]
}

// ---------------------------------------------------------------------------
// Sphere geometry: geodesic circles, rigid rotations, spherical areas.
// ---------------------------------------------------------------------------

/** Points of the geodesic circle: center (lon0, lat0), angular radius rho. */
export function geodesicCircle(lon0: number, lat0: number, rho: number, n = 72): Array<[number, number]> {
  const out: Array<[number, number]> = []
  const sinLat = Math.sin(lat0)
  const cosLat = Math.cos(lat0)
  const cosR = Math.cos(rho)
  const sinR = Math.sin(rho)
  for (let i = 0; i < n; i++) {
    const th = (i / n) * 2 * Math.PI
    const lat = Math.asin(sinLat * cosR + cosLat * sinR * Math.cos(th))
    const lon = lon0 + Math.atan2(Math.sin(th) * sinR * cosLat, cosR - sinLat * Math.sin(lat))
    out.push([lon, lat])
  }
  return out
}

/** Area of the spherical cap of angular radius rho (unit sphere). */
export function capArea(rho: number): number {
  return 2 * Math.PI * (1 - Math.cos(rho))
}

type Vec3 = [number, number, number]
const toVec = (lon: number, lat: number): Vec3 => [
  Math.cos(lat) * Math.cos(lon),
  Math.cos(lat) * Math.sin(lon),
  Math.sin(lat),
]
const toLonLat = (v: Vec3): [number, number] => [Math.atan2(v[1], v[0]), Math.asin(Math.max(-1, Math.min(1, v[2])))]

/**
 * The rigid rotation of the sphere taking point `from` to point `to`
 * (axis = from × to) — the same move thetruesize.com performs. Returns a
 * function on (lon, lat) pairs. Rodrigues' formula, exact.
 */
export function sphereRotation(
  from: [number, number],
  to: [number, number],
): (lon: number, lat: number) => [number, number] {
  const a = toVec(from[0], from[1])
  const b = toVec(to[0], to[1])
  const kx = a[1] * b[2] - a[2] * b[1]
  const ky = a[2] * b[0] - a[0] * b[2]
  const kz = a[0] * b[1] - a[1] * b[0]
  const kn = Math.hypot(kx, ky, kz)
  const cosA = a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
  if (kn < 1e-12) return (lon, lat) => [lon, lat]
  const ux = kx / kn
  const uy = ky / kn
  const uz = kz / kn
  const sinA = kn
  return (lon, lat) => {
    const v = toVec(lon, lat)
    const dot = ux * v[0] + uy * v[1] + uz * v[2]
    const cx = uy * v[2] - uz * v[1]
    const cy = uz * v[0] - ux * v[2]
    const cz = ux * v[1] - uy * v[0]
    const r: Vec3 = [
      v[0] * cosA + cx * sinA + ux * dot * (1 - cosA),
      v[1] * cosA + cy * sinA + uy * dot * (1 - cosA),
      v[2] * cosA + cz * sinA + uz * dot * (1 - cosA),
    ]
    return toLonLat(r)
  }
}

/**
 * Spherical polygon area (steradians) by the spherical shoelace — measured
 * from the same vertices the figures draw, so the receipt's denominator is a
 * measurement, not a constant.
 */
export function sphericalArea(poly: Array<[number, number]>): number {
  let sum = 0
  for (let i = 0; i < poly.length; i++) {
    const [l1, p1] = poly[i]
    const [l2, p2] = poly[(i + 1) % poly.length]
    let dl = l2 - l1
    if (dl > Math.PI) dl -= 2 * Math.PI
    if (dl < -Math.PI) dl += 2 * Math.PI
    sum += dl * (2 + Math.sin(p1) + Math.sin(p2))
  }
  return Math.abs(sum) / 2
}

/** Planar shoelace of a projected polygon, in map units². */
export function planarArea(pts: Array<[number, number]>): number {
  let sum = 0
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i]
    const [x2, y2] = pts[(i + 1) % pts.length]
    sum += x1 * y2 - x2 * y1
  }
  return Math.abs(sum) / 2
}

// ---------------------------------------------------------------------------
// Map pane: fit the world under a projection into a pixel rect and draw it.
// ---------------------------------------------------------------------------

export interface MapPane {
  proj: Proj
  rect: Rect
  scale: number // px per map unit
  cx: number // map-unit center
  cy: number
}

export function fitWorld(proj: Proj, rect: Rect): MapPane {
  const [, yTop] = proj.xy(0, proj.latMax)
  const [, yBot] = proj.xy(0, -proj.latMax)
  const w = 2 * Math.PI
  const h = yTop - yBot
  const scale = Math.min(rect.w / w, rect.h / h)
  return { proj, rect, scale, cx: 0, cy: (yTop + yBot) / 2 }
}

export function mapToPx(p: MapPane, x: number, y: number): [number, number] {
  return [p.rect.x + p.rect.w / 2 + (x - p.cx) * p.scale, p.rect.y + p.rect.h / 2 - (y - p.cy) * p.scale]
}

export function pxToMap(p: MapPane, px: number, py: number): [number, number] {
  return [(px - p.rect.x - p.rect.w / 2) / p.scale + p.cx, -(py - p.rect.y - p.rect.h / 2) / p.scale + p.cy]
}

/** Draw a lon/lat polyline through the pane's projection, splitting at the
 * antimeridian so coastlines don't smear across the map. */
export function drawGeoPath(
  ctx: CanvasRenderingContext2D,
  pane: MapPane,
  line: Array<[number, number]>,
  close = false,
) {
  ctx.beginPath()
  let prevLon = 0
  let started = false
  for (let i = 0; i < line.length; i++) {
    const [lon, lat] = line[i]
    if (started && Math.abs(lon - prevLon) > Math.PI) {
      started = false // antimeridian hop: lift the pen
    }
    const [x, y] = pane.proj.xy(lon, lat)
    const [px, py] = mapToPx(pane, x, y)
    if (!started) {
      ctx.moveTo(px, py)
      started = true
    } else ctx.lineTo(px, py)
    prevLon = lon
  }
  if (close) ctx.closePath()
}

export function drawCoastlines(ctx: CanvasRenderingContext2D, pane: MapPane, color = 'rgba(90,110,140,0.55)') {
  ctx.strokeStyle = color
  ctx.lineWidth = 1
  for (const line of COASTLINE) {
    drawGeoPath(
      ctx,
      pane,
      line.map(([lo, la]) => [rad(lo), rad(la)] as [number, number]),
    )
    ctx.stroke()
  }
}

export function drawGraticule(ctx: CanvasRenderingContext2D, pane: MapPane, stepDeg = 30) {
  ctx.strokeStyle = 'rgba(120,140,170,0.25)'
  ctx.lineWidth = 1
  const latCap = pane.proj.latMax
  for (let lon = -180; lon <= 180; lon += stepDeg) {
    const line: Array<[number, number]> = []
    for (let lat = -84; lat <= 84; lat += 2) {
      const c = Math.max(-latCap, Math.min(latCap, rad(lat)))
      line.push([rad(lon), c])
    }
    drawGeoPath(ctx, pane, line)
    ctx.stroke()
  }
  for (let lat = -60; lat <= 60; lat += stepDeg) {
    const line: Array<[number, number]> = []
    for (let lon = -180; lon <= 180; lon += 2) line.push([rad(lon), rad(lat)])
    drawGeoPath(ctx, pane, line)
    ctx.stroke()
  }
  // equator slightly stronger — the one line every projection agrees about
  ctx.strokeStyle = 'rgba(120,140,170,0.4)'
  const eq: Array<[number, number]> = []
  for (let lon = -180; lon <= 180; lon += 2) eq.push([rad(lon), 0])
  drawGeoPath(ctx, pane, eq)
  ctx.stroke()
}

/** The measured inflation receipt of a lon/lat polygon under a pane's
 * projection: planar shoelace over spherical shoelace. Both sides measured. */
export function inflation(pane: MapPane, poly: Array<[number, number]>): number {
  const projected = poly.map(([lon, lat]) => pane.proj.xy(lon, lat))
  return planarArea(projected) / sphericalArea(poly)
}

export function fmtTimes(v: number): string {
  return v >= 100 ? `×${Math.round(v)}` : `×${fmt(v, v >= 10 ? 1 : 2)}`
}
