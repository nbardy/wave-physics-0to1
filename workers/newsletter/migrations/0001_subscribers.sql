CREATE TABLE subscribers (
  email TEXT PRIMARY KEY COLLATE NOCASE,
  source TEXT NOT NULL,
  consent_text TEXT NOT NULL,
  subscribed_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  unsubscribe_token TEXT NOT NULL UNIQUE,
  unsubscribed_at TEXT
);
