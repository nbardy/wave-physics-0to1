// Compact Natural Earth 110m coastline + Greenland into a TS module.
// Round to 2 decimals, drop consecutive points closer than ~0.4°, drop
// polylines with < 6 points (islets invisible at article scale).
import { readFileSync, writeFileSync } from 'fs'

type Pt = [number, number]
const round = (v: number) => Math.round(v * 100) / 100

function decimate(line: Pt[], minDeg: number): Pt[] {
  const out: Pt[] = []
  for (const [lon, lat] of line) {
    const p: Pt = [round(lon), round(lat)]
    const last = out[out.length - 1]
    if (!last || Math.hypot(p[0] - last[0], p[1] - last[1]) >= minDeg) out.push(p)
  }
  const last = line[line.length - 1]
  const kept = out[out.length - 1]
  if (kept[0] !== round(last[0]) || kept[1] !== round(last[1])) out.push([round(last[0]), round(last[1])])
  return out
}

const coast = JSON.parse(readFileSync('coastline.json', 'utf8'))
const lines: Pt[][] = []
for (const f of coast.features) {
  const g = f.geometry
  const raw: Pt[][] = g.type === 'LineString' ? [g.coordinates] : g.coordinates
  for (const line of raw) {
    const d = decimate(line, 0.4)
    if (d.length >= 6) lines.push(d)
  }
}

const grl = JSON.parse(readFileSync('greenland.json', 'utf8'))
const gpoly: Pt[] = decimate(grl.features[0].geometry.coordinates[0], 0.25)

const header = `// World coastline + Greenland outline, compacted for the maths-01 figures.
// Source: Natural Earth 1:110m (public domain), via
//   github.com/martynafford/natural-earth-geojson (ne_110m_coastline)
//   github.com/johan/world.geo.json (GRL)
// Coordinates are [lon, lat] degrees, rounded to 0.01°, decimated to ~0.4°
// spacing, islets dropped. Regenerate with the compact.ts script noted in
// articles/maths/01-jacobian-hessian/PLAN.md if the source ever changes.

export type LonLat = [number, number]
`
const body =
  `export const COASTLINE: LonLat[][] = ${JSON.stringify(lines)}\n\n` +
  `export const GREENLAND: LonLat[] = ${JSON.stringify(gpoly)}\n`
writeFileSync('geo.ts', header + body)
const pts = lines.reduce((a, l) => a + l.length, 0)
console.log('lines:', lines.length, 'points:', pts, 'greenland pts:', gpoly.length, 'bytes:', (header + body).length)
