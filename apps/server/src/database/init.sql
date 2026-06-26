CREATE TABLE users (
  id           UUID PRIMARY KEY,
  nickname     VARCHAR(32) UNIQUE NOT NULL,
  token        UUID UNIQUE NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_token ON users (token);

CREATE TABLE messages (
  id              UUID PRIMARY KEY,
  author_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content         TEXT NOT NULL CHECK (length(content) >= 1 AND length(content) <= 4000),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_created ON messages (created_at DESC, id DESC);
CREATE INDEX idx_messages_author ON messages (author_id);
