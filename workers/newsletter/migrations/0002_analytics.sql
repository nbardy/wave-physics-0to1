CREATE TABLE IF NOT EXISTS analytics_events (
  seq INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id TEXT NOT NULL,
  event_id TEXT NOT NULL,
  visitor_id TEXT,
  session_id TEXT,
  user_id TEXT,
  name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('page', 'event')),
  timestamp INTEGER NOT NULL,
  received_at INTEGER NOT NULL,
  path TEXT NOT NULL,
  referrer TEXT,
  properties TEXT NOT NULL CHECK (json_valid(properties)),
  source TEXT NOT NULL CHECK (source IN ('browser', 'server')),
  bot INTEGER NOT NULL CHECK (bot IN (0,1)),
  UNIQUE (site_id, source, event_id)
);
CREATE INDEX IF NOT EXISTS analytics_site_time ON analytics_events(site_id, timestamp);
CREATE INDEX IF NOT EXISTS analytics_site_visitor_time ON analytics_events(site_id, visitor_id, timestamp);
CREATE INDEX IF NOT EXISTS analytics_site_session_time ON analytics_events(site_id, session_id, timestamp);
