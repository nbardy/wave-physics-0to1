interface Env {
  /** Secret set with `wrangler secret put`; absent means every report request is forbidden. */
  ANALYTICS_READ_TOKEN?: string
}
