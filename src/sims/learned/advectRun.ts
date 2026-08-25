// Runtime lanes for the advection figures: one fine reference and any number
// of coarse lanes over the same frozen swirl, stepped in lockstep. All the
// physics lives in advect.ts; this file only owns per-case caching and the
// step loop the three figures share.

import {
  CNX,
  CNY,
  DT,
  FNX,
  FNY,
  advectCorrection,
  applySL,
  makeAdvectActs,
  makeSLOp,
  makeSwirl,
  restrictTo,
  sampleVelocity,
  seedPattern,
  total,
  type AdvectCase,
  type AdvectWeights,
  type SLOp,
} from './advect'

interface Frozen {
  fineOp: SLOp
  coarseOps: Map<number, SLOp>
  coarseVel: Map<number, { u: Float32Array; v: Float32Array }>
}

// The swirl, its velocity samples, and the SL gathers never change for a given
// case — build them once per (case, factor) and keep them for the session.
const FROZEN = new Map<string, Frozen>()

function frozenFor(spec: AdvectCase, factor: number): { op: SLOp; u: Float32Array; v: Float32Array; fineOp: SLOp } {
  let f = FROZEN.get(spec.id)
  if (!f) {
    const sw = makeSwirl(spec.seed, spec.peak, spec.nVortices)
    const fine = sampleVelocity(sw, FNX, FNY)
    f = { fineOp: makeSLOp(FNX, FNY, fine.u, fine.v, DT), coarseOps: new Map(), coarseVel: new Map() }
    // stash the swirl for coarser grids without recomputing the rescale pass
    ;(f as Frozen & { sw?: ReturnType<typeof makeSwirl> }).sw = sw
    FROZEN.set(spec.id, f)
  }
  if (!f.coarseOps.has(factor)) {
    const sw = (f as Frozen & { sw: ReturnType<typeof makeSwirl> }).sw
    const vel = sampleVelocity(sw, FNX / factor, FNY / factor)
    f.coarseVel.set(factor, vel)
    f.coarseOps.set(factor, makeSLOp(FNX / factor, FNY / factor, vel.u, vel.v, DT))
  }
  const vel = f.coarseVel.get(factor)
  const op = f.coarseOps.get(factor)
  if (!vel || !op) throw new Error('frozen cache miss')
  return { op, u: vel.u, v: vel.v, fineOp: f.fineOp }
}

export class FineLane {
  dye = new Float32Array(FNX * FNY)
  private next = new Float32Array(FNX * FNY)
  private op: SLOp
  constructor(spec: AdvectCase) {
    this.op = frozenFor(spec, 4).fineOp
    seedPattern(spec.pattern, FNX, FNY, this.dye)
  }
  reseed(spec: AdvectCase) {
    seedPattern(spec.pattern, FNX, FNY, this.dye)
  }
  step() {
    applySL(this.op, this.dye, this.next)
    ;[this.dye, this.next] = [this.next, this.dye]
  }
  /** The ghost at a coarsening — what the coarse lanes are trying to be. */
  restrictInto(nx: number, ny: number, out: Float32Array) {
    restrictTo(this.dye, nx, ny, out)
  }
}

export class CoarseLane {
  readonly nx: number
  readonly ny: number
  dye: Float32Array
  private next: Float32Array
  private op: SLOp
  private u: Float32Array
  private v: Float32Array
  private corr: Float32Array
  private act = makeAdvectActs()
  mass0 = 0
  constructor(
    spec: AdvectCase,
    factor: number,
    private w: AdvectWeights | null,
    public strength = 1,
  ) {
    this.nx = FNX / factor
    this.ny = FNY / factor
    if (w && (this.nx !== CNX || this.ny !== CNY)) throw new Error('the net is trained at factor 4 only')
    const fr = frozenFor(spec, factor)
    this.op = fr.op
    this.u = fr.u
    this.v = fr.v
    this.dye = new Float32Array(this.nx * this.ny)
    this.next = new Float32Array(this.nx * this.ny)
    this.corr = new Float32Array(this.nx * this.ny)
    seedPattern(spec.pattern, this.nx, this.ny, this.dye)
    this.mass0 = total(this.dye)
  }
  step() {
    applySL(this.op, this.dye, this.next)
    if (this.w) {
      advectCorrection(this.w, this.next, this.u, this.v, this.corr, this.act)
      for (let k = 0; k < this.next.length; k++) this.next[k] += this.strength * this.corr[k]
    }
    ;[this.dye, this.next] = [this.next, this.dye]
  }
  /** Relative mass drift since seeding — the necessary check, live. */
  massDrift(): number {
    return this.mass0 === 0 ? 0 : (total(this.dye) - this.mass0) / this.mass0
  }
}
