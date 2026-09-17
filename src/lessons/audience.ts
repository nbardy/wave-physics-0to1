// Who is looking, decided once per page load from `?draft=` and what this
// browser remembered. This is the only place the flag is read or written;
// everything else asks the catalogue for the audience it was built for.
import type { Audience } from './registry'

export type Mode = 'development' | 'production'

// What `?draft=` said, as a sum: the two instructions, its absence, and a
// value we do not recognise — kept as data so the caller can say so.
export type DraftParam =
  | { kind: 'on' }
  | { kind: 'off' }
  | { kind: 'absent' }
  | { kind: 'unknown'; raw: string }

export function parseDraftParam(search: string): DraftParam {
  const raw = new URLSearchParams(search).get('draft')
  if (raw === null) return { kind: 'absent' }
  if (raw === 'true') return { kind: 'on' }
  if (raw === 'false') return { kind: 'off' }
  return { kind: 'unknown', raw }
}

// What the browser remembered from an earlier `?draft=`. `unavailable` is
// storage we cannot read (private windows, blocked site data): the flag still
// works for this page load, it just will not survive a reload. `unknown` is a
// value under our key that we never wrote.
export type Remembered =
  | { kind: 'on' }
  | { kind: 'off' }
  | { kind: 'absent' }
  | { kind: 'unavailable' }
  | { kind: 'unknown'; raw: string }

export const STORAGE_KEY = 'drafts'

const READER: Audience = { kind: 'reader' }
const EDITOR: Audience = { kind: 'editor' }

// With nothing asked and nothing remembered, development shows everything so
// working copies can be read, and a production visitor is a reader.
const DEFAULT: Record<Mode, Audience> = { development: EDITOR, production: READER }

const BY_REMEMBERED: Record<Remembered['kind'], (mode: Mode) => Audience> = {
  on: () => EDITOR,
  off: () => READER,
  absent: (mode) => DEFAULT[mode],
  unavailable: (mode) => DEFAULT[mode],
  unknown: (mode) => DEFAULT[mode],
}

const BY_PARAM: Record<DraftParam['kind'], (remembered: Remembered, mode: Mode) => Audience> = {
  on: () => EDITOR,
  off: () => READER,
  absent: (remembered, mode) => BY_REMEMBERED[remembered.kind](mode),
  unknown: (remembered, mode) => BY_REMEMBERED[remembered.kind](mode),
}

/** The URL wins; then memory; then the mode's default. */
export function resolveAudience(param: DraftParam, remembered: Remembered, mode: Mode): Audience {
  return BY_PARAM[param.kind](remembered, mode)
}

// An instruction in the URL is remembered; absence and unknown values change nothing.
const PERSIST: Record<DraftParam['kind'], (storage: Storage) => void> = {
  on: (storage) => storage.setItem(STORAGE_KEY, 'on'),
  off: (storage) => storage.setItem(STORAGE_KEY, 'off'),
  absent: () => {},
  unknown: () => {},
}

function readRemembered(storage: Storage): Remembered {
  const raw = storage.getItem(STORAGE_KEY)
  if (raw === null) return { kind: 'absent' }
  if (raw === 'on') return { kind: 'on' }
  if (raw === 'off') return { kind: 'off' }
  return { kind: 'unknown', raw }
}

// Absence is the meaning here: null is a browser that refuses site storage.
function siteStorage(): Storage | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

/** The browser-side κ: read the flag, remember an instruction, decide the audience. */
export function readAudience(mode: Mode): Audience {
  const param = parseDraftParam(window.location.search)
  if (param.kind === 'unknown') {
    console.warn(`?draft=${param.raw} is not an instruction; use ?draft=true or ?draft=false`)
  }
  const storage = siteStorage()
  if (storage === null) return resolveAudience(param, { kind: 'unavailable' }, mode)
  PERSIST[param.kind](storage)
  return resolveAudience(param, readRemembered(storage), mode)
}
