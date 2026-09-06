// The hero's weight feed — Part 3's fabric-native trainer (denoiseFabric.ts,
// FABRIC_TRAIN_DEFAULTS verbatim) run LIVE, so the wall of dreams can be
// watched learning from coin-toss weights instead of shipping pretrained.
// Measured 2026-09-06 (bun, Apple Silicon): 31 ms/epoch, the full 700-epoch
// run 22 s, and the gain is front-loaded — dreams go from ~27 px wrong / 0%
// in family at epoch 0 to ~11 px / 40% by epoch 75 (2.3 s) and ~8–9 px /
// 60–70% by epoch 350+. Cheaper configs (fewer draws, shorter negative
// chains) reach 11–12 px in a second but plateau mushy, so the honest
// default config is also the watchable one.
//
// Two things live here so they cannot drift apart:
//   1. THE WALL'S SCHEDULE — 1 hidden-warm + 23 free sweeps per level, on
//      BilledWall's salts — as one straight-line dream function, and as the
//      per-sweep pieces the wall's chains call frame by frame. A check asserts
//      a chain's finished dream equals the straight-line dream for the same
//      run, so the instrument scores exactly what the wall does. The budget is
//      FabricDream's default (24), not BilledWall's billed k=6: measured on
//      the shipped weights, 200 dreams (2026-09-06) — k=6: 11.7 px mean, 41%
//      within 10 px; k=12: 8.3 px, 63%; k=24: 6.1 px, 74%; k=48: 4.3 px, 83%.
//      The hero is unpriced; Part 3 prices the sweeps and shows what k=6 buys.
//   2. THE FEED — a sum of two constructors behind one interface: a Web
//      Worker (the browser: full-speed training off the frame loop, weights
//      posted every POST_EVERY epochs) and an inline trainer (headless checks:
//      the same chunks, run synchronously in poll()). The stepper is agnostic.

import { N_LEVELS } from './denoise'
import {
  FABRIC_TRAIN_DEFAULTS,
  createFabricTrainer,
  initFabricModel,
  sweepFabric,
  type FabricModel,
  type FabricPlacement,
  type FabricSampler,
  type FabricTrainer,
} from './denoiseFabric'
import { GLYPH8_LIST, GLYPH8_PIX, nearestGlyph8Distance } from './glyphs8'
import { u01 } from './lib'

export const WARM_SWEEPS = 1
export const FREE_SWEEPS = 23
/** Sweeps per level the wall runs and the probe scores. */
export const K_SWEEPS = WARM_SWEEPS + FREE_SWEEPS
/** "Family member" at 8×8: ≤10 of 64 px astray (FabricDream's threshold). */
export const FAMILY_PX = 10
export const PROBE_DREAMS = 40
const PROBE_SEED = 4242
/** Epochs between weight posts — ~0.6 s of trainer time plus a ~0.1 s probe
 *  (40 dreams × 2.3 ms at k=24) per post. */
export const POST_EVERY = 20
export const TRAIN_EPOCHS = FABRIC_TRAIN_DEFAULTS.epochs

const CHROM: FabricSampler = { kind: 'chromatic' }

// ---------------------------------------------------------------------------
// The wall's schedule — salts identical to BilledWall's tick.
// ---------------------------------------------------------------------------

/** Coin-toss x_T for dream `run`. */
export function coinsInto(seed: number, run: number, x: Int8Array): void {
  for (let i = 0; i < GLYPH8_PIX; i++) x[i] = u01(seed, run, i, 999) < 0.5 ? -1 : 1
}

/** Open level t: pixels take the evidence x_t, hidden nodes take fresh coins. */
export function openLevel(
  pl: FabricPlacement,
  x: Int8Array,
  patch: Int8Array,
  seed: number,
  run: number,
  t: number,
): void {
  for (let i = 0; i < pl.g.n; i++) {
    const p = pl.pixOf[i]
    patch[i] = p >= 0 ? x[p] : u01(seed, run * 16 + t, i, 3) < 0.5 ? -1 : 1
  }
}

/** Sweep `sw` (0-based within the level) of the k=6 schedule. */
export function wallSweep(
  m: FabricModel,
  pl: FabricPlacement,
  x: Int8Array,
  patch: Int8Array,
  seed: number,
  run: number,
  t: number,
  sw: number,
): void {
  if (sw < WARM_SWEEPS) {
    sweepFabric(m, pl, x, patch, false, CHROM, (site, salt) =>
      u01(seed, run * 16 + t, site, sw * 8 + 200 + salt),
    )
  } else {
    const f = sw - WARM_SWEEPS
    sweepFabric(m, pl, x, patch, true, CHROM, (site, salt) =>
      u01(seed, run * 16 + t, site, f * 8 + 16 + salt),
    )
  }
}

/** Readout: the patch's pixels, as the next level's evidence. */
export function readoutInto(pl: FabricPlacement, patch: Int8Array, y: Int8Array): void {
  for (let p = 0; p < GLYPH8_PIX; p++) y[p] = patch[pl.visible[p]]
}

/** The whole dream, straight-line — what a wall chain does across frames. */
export function dreamOnWall(
  models: FabricModel[],
  pl: FabricPlacement,
  seed: number,
  run: number,
): Int8Array {
  let x = new Int8Array(GLYPH8_PIX)
  coinsInto(seed, run, x)
  const patch = new Int8Array(pl.g.n)
  for (let t = N_LEVELS; t >= 1; t--) {
    openLevel(pl, x, patch, seed, run, t)
    for (let sw = 0; sw < K_SWEEPS; sw++) wallSweep(models[t - 1], pl, x, patch, seed, run, t, sw)
    const y = new Int8Array(GLYPH8_PIX)
    readoutInto(pl, patch, y)
    x = y
  }
  return x
}

export function sigOf(x: Int8Array): string {
  let s = ''
  for (let p = 0; p < GLYPH8_PIX; p++) s += x[p] > 0 ? '1' : '0'
  return s
}

// ---------------------------------------------------------------------------
// The instrument — fresh test dreams on the wall's own schedule.
// ---------------------------------------------------------------------------

export interface Quality {
  /** mean Hamming distance to the nearest of the seven, over PROBE_DREAMS */
  meanPx: number
  /** fraction within FAMILY_PX */
  family: number
}

export function probeQuality(models: FabricModel[], pl: FabricPlacement): Quality {
  let dist = 0
  let fam = 0
  for (let r = 0; r < PROBE_DREAMS; r++) {
    const d = nearestGlyph8Distance(dreamOnWall(models, pl, PROBE_SEED, r))
    dist += d
    if (d <= FAMILY_PX) fam++
  }
  return { meanPx: dist / PROBE_DREAMS, family: fam / PROBE_DREAMS }
}

// ---------------------------------------------------------------------------
// The feed.
// ---------------------------------------------------------------------------

export interface TrainUpdate {
  /** training generation — a restart bumps it; stale posts are dropped */
  gen: number
  epoch: number
  epochs: number
  models: FabricModel[]
  quality: Quality
  /** cumulative trainer compute time this generation, ms */
  trainMs: number
}

export interface WeightFeed {
  /** Updates that arrived since the last poll, in order. */
  poll(): TrainUpdate[]
  /** Fresh coin-toss weights at `seed`; a new generation. */
  restart(gen: number, seed: number): void
  dispose(): void
}

export interface FeedConfig {
  gen: number
  seed: number
  epochs: number
}

/** Epoch-0 weights — the trainer's own init, so the wall can dream before the
 *  first post lands (asserted equal to the trainer's in the check). */
export function coinTossModels(pl: FabricPlacement, seed: number): FabricModel[] {
  return Array.from({ length: N_LEVELS }, (_, t) => initFabricModel(pl, seed + 7 * t))
}

export function newTrainer(pl: FabricPlacement, seed: number): FabricTrainer {
  return createFabricTrainer(GLYPH8_LIST, pl, { ...FABRIC_TRAIN_DEFAULTS, sampler: CHROM, seed })
}

export function snapshot(
  tr: FabricTrainer,
  pl: FabricPlacement,
  cfg: FeedConfig,
  trainMs: number,
): TrainUpdate {
  return {
    gen: cfg.gen,
    epoch: tr.epoch,
    epochs: cfg.epochs,
    models: tr.models.map((m) => ({
      b: Float32Array.from(m.b),
      u: Float32Array.from(m.u),
      J: Float32Array.from(m.J),
    })),
    quality: probeQuality(tr.models, pl),
    trainMs,
  }
}

/** Headless: the same chunks as the worker, run synchronously inside poll(). */
export function createInlineFeed(
  pl: FabricPlacement,
  cfg: FeedConfig,
  epochsPerPoll: number,
): WeightFeed {
  let c = cfg
  let tr = newTrainer(pl, c.seed)
  let ms = 0
  let opened = false
  return {
    poll() {
      if (!opened) {
        opened = true
        return [snapshot(tr, pl, c, ms)]
      }
      if (tr.epoch >= c.epochs) return []
      const a = performance.now()
      tr.runEpochs(Math.min(epochsPerPoll, c.epochs - tr.epoch))
      ms += performance.now() - a
      return [snapshot(tr, pl, c, ms)]
    },
    restart(gen, seed) {
      c = { ...c, gen, seed }
      tr = newTrainer(pl, seed)
      ms = 0
      opened = false
    },
    dispose() {},
  }
}

export interface StartMessage {
  kind: 'start'
  cfg: FeedConfig
}

/** The browser: training off the frame loop, weights posted every POST_EVERY epochs. */
export function createWorkerFeed(cfg: FeedConfig): WeightFeed {
  const worker = new Worker(new URL('./learnWorker.ts', import.meta.url), { type: 'module' })
  const queue: TrainUpdate[] = []
  worker.onmessage = (e: MessageEvent<TrainUpdate>) => {
    queue.push(e.data)
  }
  const start = (c: FeedConfig) => {
    const msg: StartMessage = { kind: 'start', cfg: c }
    worker.postMessage(msg)
  }
  start(cfg)
  return {
    poll() {
      return queue.splice(0, queue.length)
    },
    restart(gen, seed) {
      start({ ...cfg, gen, seed })
    },
    dispose() {
      worker.terminate()
    },
  }
}
