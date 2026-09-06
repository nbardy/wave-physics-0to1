// The hero's training worker — runs learnFeed's chunks at full speed off the
// frame loop and posts a TrainUpdate every POST_EVERY epochs. A 'start'
// message with a newer generation abandons the run in progress; the loop
// yields to the event queue between chunks so that message can arrive.

import { placeGlyph8 } from './denoiseFabric'
import { POST_EVERY, newTrainer, snapshot, type FeedConfig, type StartMessage } from './learnFeed'

const pl = placeGlyph8()
let current = -1

const yieldToQueue = () => new Promise<void>((r) => setTimeout(r, 0))

async function train(cfg: FeedConfig): Promise<void> {
  const tr = newTrainer(pl, cfg.seed)
  let ms = 0
  postMessage(snapshot(tr, pl, cfg, ms))
  while (tr.epoch < cfg.epochs) {
    await yieldToQueue()
    if (current !== cfg.gen) return
    const a = performance.now()
    tr.runEpochs(Math.min(POST_EVERY, cfg.epochs - tr.epoch))
    ms += performance.now() - a
    postMessage(snapshot(tr, pl, cfg, ms))
  }
}

onmessage = (e: MessageEvent<StartMessage>) => {
  current = e.data.cfg.gen
  void train(e.data.cfg)
}
