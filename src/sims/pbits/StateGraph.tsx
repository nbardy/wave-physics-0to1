import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import { FONT_LABEL, FONT_METER, fmt } from '../lib/chrome'
import { drawLayerRail, enumerate, frustratedLoop, stateIndex, u01 } from './lib'

// PLAN F8 — the state graph. All 16 states of the four-loop as nodes,
// single-flip transitions as edges, the running chain a dot walking the graph.
// Node size is exact Boltzmann mass; visit shading converges on node size —
// stationarity, watched. With the schedule toggle (`schedules`), the same
// display becomes the teleport ILLUSTRATION: a synchronous sampler jumps along
// chords that are not edges — several spins moving in one tick — and every
// such chord flashes.
//
// SCOPE (rev. 2, 2026-08-05 — this bit us once): this display contrasts
// sequential vs synchronous ONLY, and it is an illustration of "a different
// process", NOT the discriminator between legal and illegal parallelism. A
// chromatic half-sweep ALSO moves many spins in one tick, so multi-spin moves
// prove nothing against it — the honest discriminator is write conflicts
// (edges between simultaneously-written spins), drawn in WriteConflict.tsx.
// Never add a chromatic option here, and never frame the chord counter as
// what convicts synchronous.

const BETA = 0.8
const HOP_DT = 1 / 7
const N = 4
const STATES = 1 << N

function hamming(a: number, b: number): number {
  let x = a ^ b
  let c = 0
  while (x) {
    c += x & 1
    x >>= 1
  }
  return c
}

function popcount(x: number): number {
  return hamming(x, 0)
}

// Layout: states in columns by number of up-spins (hypercube layers).
function layout(w: number, h: number): Array<[number, number]> {
  const layers: number[][] = [[], [], [], [], []]
  for (let idx = 0; idx < STATES; idx++) layers[popcount(idx)].push(idx)
  const pos: Array<[number, number]> = Array.from({ length: STATES }, () => [0, 0])
  layers.forEach((layer, k) => {
    const x = 50 + (k / 4) * (w - 100)
    layer.forEach((idx, r) => {
      const y = h / 2 + (r - (layer.length - 1) / 2) * ((h - 90) / Math.max(3, layer.length - 1))
      pos[idx] = [x, y]
    })
  })
  return pos
}

export type GraphScheduleKind = 'sequential' | 'synchronous'

export interface StateGraphShared {
  schedule: GraphScheduleKind
}

export interface StateGraphProbe {
  visits: Float64Array
  nonEdgeMoves: number
  totalMoves: number
}

export function createStateGraph(
  shared: { current: StateGraphShared },
  probe?: StateGraphProbe,
  seed = 47,
): Stepper {
  const m = frustratedLoop(BETA)
  const exact = enumerate(m)
  const s = Int8Array.from([1, -1, 1, 1])
  const visits = probe?.visits ?? new Float64Array(STATES)
  let site = 0
  let tick = 0
  let acc = 0
  // animation: previous → current node, plus a short memory of illegal chords
  let prevIdx = stateIndex(s)
  let curIdx = prevIdx
  let hopAge = 1
  const flashes: Array<{ a: number; b: number; age: number }> = []
  let lastSchedule = shared.current.schedule

  const move = () => {
    tick++
    const before = stateIndex(s)
    if (shared.current.schedule === 'sequential') {
      const i = site
      site = (site + 1) % N
      let f = m.h[i]
      for (let k = 0; k < m.nbr[i].length; k++) f += m.wgt[i][k] * s[m.nbr[i][k]]
      s[i] = u01(seed, tick, i, 0) < 1 / (1 + Math.exp(-2 * BETA * f)) ? 1 : -1
    } else {
      const old = Int8Array.from(s)
      for (let i = 0; i < N; i++) {
        let f = m.h[i]
        for (let k = 0; k < m.nbr[i].length; k++) f += m.wgt[i][k] * old[m.nbr[i][k]]
        s[i] = u01(seed, tick, i, 0) < 1 / (1 + Math.exp(-2 * BETA * f)) ? 1 : -1
      }
    }
    const after = stateIndex(s)
    visits[after]++
    if (probe) {
      probe.totalMoves++
      if (hamming(before, after) > 1) probe.nonEdgeMoves++
    }
    if (after !== before) {
      prevIdx = before
      curIdx = after
      hopAge = 0
      if (hamming(before, after) > 1) flashes.push({ a: before, b: after, age: 0 })
    }
  }

  return {
    step(dt) {
      if (shared.current.schedule !== lastSchedule) {
        lastSchedule = shared.current.schedule
        visits.fill(0)
        if (probe) {
          probe.nonEdgeMoves = 0
          probe.totalMoves = 0
        }
        flashes.length = 0
      }
      acc += dt
      while (acc >= HOP_DT) {
        acc -= HOP_DT
        move()
      }
      hopAge = Math.min(1, hopAge + dt / 0.14)
      for (const fl of flashes) fl.age += dt
      while (flashes.length && flashes[0].age > 1.2) flashes.shift()
    },
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      drawLayerRail(ctx, w, 'sampler')
      const pos = layout(w, h)

      // legal edges: one-bit flips
      ctx.strokeStyle = 'rgba(120,140,170,0.3)'
      ctx.lineWidth = 1
      for (let a = 0; a < STATES; a++) {
        for (let b = a + 1; b < STATES; b++) {
          if (hamming(a, b) !== 1) continue
          ctx.beginPath()
          ctx.moveTo(pos[a][0], pos[a][1])
          ctx.lineTo(pos[b][0], pos[b][1])
          ctx.stroke()
        }
      }

      // illegal chords, flashing as they decay
      for (const fl of flashes) {
        ctx.strokeStyle = `rgba(220,38,38,${Math.max(0, 0.9 - fl.age * 0.75)})`
        ctx.lineWidth = 2.4
        ctx.beginPath()
        ctx.moveTo(pos[fl.a][0], pos[fl.a][1])
        ctx.lineTo(pos[fl.b][0], pos[fl.b][1])
        ctx.stroke()
      }

      // nodes: outline radius = exact mass, fill shade = visit share
      let visitPeak = 0
      let exactPeak = 0
      for (let i = 0; i < STATES; i++) {
        visitPeak = Math.max(visitPeak, visits[i])
        exactPeak = Math.max(exactPeak, exact[i])
      }
      for (let i = 0; i < STATES; i++) {
        const r = 5 + Math.sqrt(exact[i] / exactPeak) * 13
        const share = visitPeak ? visits[i] / visitPeak : 0
        ctx.beginPath()
        ctx.arc(pos[i][0], pos[i][1], r, 0, Math.PI * 2)
        ctx.fillStyle = PALETTE.meter
        ctx.globalAlpha = 0.12 + share * 0.55
        ctx.fill()
        ctx.globalAlpha = 1
        ctx.strokeStyle = PALETTE.ghost
        ctx.lineWidth = 1.4
        ctx.stroke()
      }

      // the walker, gliding from its previous node
      const t = hopAge
      const dx = pos[prevIdx][0] + (pos[curIdx][0] - pos[prevIdx][0]) * t
      const dy = pos[prevIdx][1] + (pos[curIdx][1] - pos[prevIdx][1]) * t
      ctx.beginPath()
      ctx.arc(dx, dy, 6, 0, Math.PI * 2)
      ctx.fillStyle = PALETTE.sUp
      ctx.fill()

      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.fillText('ring size = exact probability · fill = how often the walker has visited', 12, h - 10)
      if (probe && shared.current.schedule === 'synchronous') {
        ctx.font = FONT_METER
        ctx.fillStyle = '#dc2626'
        const fr = probe.totalMoves ? probe.nonEdgeMoves / probe.totalMoves : 0
        // "multi-spin", not "illegal" — chromatic also moves many spins at
        // once; what this counter shows is a different process, not the crime.
        // The qualifier line below carries that scope on-canvas (final
        // external audit item, 2026-08-06): without it the chord counter reads
        // as the conviction, which would wrongly indict chromatic half-sweeps.
        // ("red/black" is deliberately not named — the rescue hasn't been
        // taught yet when this figure runs.)
        ctx.fillText(`multi-spin moves: ${fmt(fr * 100, 1)}% of moves`, 12, 22)
        ctx.font = FONT_LABEL
        ctx.fillStyle = 'rgba(85,96,111,0.9)'
        ctx.fillText('legal sweeps make multi-spin moves too — not the crime', 12, 38)
      }
    },
  }
}

export function StateGraph({ schedules = false }: { schedules?: boolean }) {
  const [schedule, setSchedule] = useState<GraphScheduleKind>('sequential')
  const shared = useRef<StateGraphShared>({ schedule })
  shared.current.schedule = schedule
  const probe = useRef<StateGraphProbe>({
    visits: new Float64Array(STATES),
    nonEdgeMoves: 0,
    totalMoves: 0,
  })

  return (
    <Sim
      height={300}
      create={() => {
        probe.current.visits.fill(0)
        probe.current.nonEdgeMoves = 0
        probe.current.totalMoves = 0
        return createStateGraph(shared, probe.current)
      }}
    >
      {schedules && (
        <>
          {(['sequential', 'synchronous'] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setSchedule(k)}
              style={schedule === k ? { fontWeight: 700 } : undefined}
            >
              {k === 'sequential' ? 'one at a time' : 'all at once'}
            </button>
          ))}
        </>
      )}
    </Sim>
  )
}
