import { readFileSync } from 'node:fs'

const args = process.argv.slice(2).filter(arg => arg !== '--')
if (args.includes('--help')) {
  console.log('bun run analytics -- --report stats|pages|events|reading|flows|funnel|journey --days 7\nOptional: --from <Unix ms> --to <Unix ms> --steps <JSON> --sessionId <ID> --limit <n>\nUses ANALYTICS_READ_TOKEN or workers/newsletter/.dev.vars. No credentials are printed.')
  process.exit(0)
}
const allowed = new Set(['report', 'days', 'from', 'to', 'steps', 'sessionId', 'limit', 'windowMs', 'subject'])
const input = new Map<string, string>()
for (let i = 0; i < args.length; i += 2) {
  const key = args[i].replace(/^--/, '')
  if (!allowed.has(key) || !args[i + 1]) throw new Error(`Invalid option: ${args[i]}. Use --help.`)
  input.set(key, args[i + 1])
}
let token = process.env.ANALYTICS_READ_TOKEN
if (!token) {
  try {
    const vars = readFileSync(new URL('../workers/newsletter/.dev.vars', import.meta.url), 'utf8')
    token = vars.match(/^ANALYTICS_READ_TOKEN\s*=\s*["']?([^\s"']+)["']?\s*$/m)?.[1]
  } catch (error) {
    if (!(error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT')) throw error
  }
}
if (!token) throw new Error('Set ANALYTICS_READ_TOKEN or add it to workers/newsletter/.dev.vars.')
const days = Number(input.get('days') ?? 7)
if (!Number.isFinite(days) || days <= 0 || days > 366) throw new Error('--days must be between 0 and 366.')
const to = Number(input.get('to') ?? Date.now())
const from = Number(input.get('from') ?? to - days * 86_400_000)
if (!Number.isSafeInteger(from) || !Number.isSafeInteger(to) || from < 0 || to <= from) throw new Error('Invalid report time range.')
const url = new URL('https://visual-explainers-newsletter.nicholasbardy.workers.dev/reports')
url.searchParams.set('report', input.get('report') ?? 'stats')
url.searchParams.set('from', String(from))
url.searchParams.set('to', String(to))
for (const [key, value] of input) if (!['days', 'from', 'to', 'report'].includes(key)) url.searchParams.set(key, value)
const response = await fetch(url, {
  headers: { Authorization: `Bearer ${token}` }, redirect: 'error', signal: AbortSignal.timeout(15000),
})
if (!response.ok) throw new Error(`Analytics report failed (HTTP ${response.status}).`)
console.log(JSON.stringify(await response.json(), null, 2))
