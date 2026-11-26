CREATE TABLE IF NOT EXISTS transcriptions (
  id           SERIAL PRIMARY KEY,
  title        VARCHAR(200) NOT NULL,
  content      TEXT         NOT NULL,
  language     VARCHAR(32),
  source       VARCHAR(16)  NOT NULL DEFAULT 'live' CHECK (source IN ('live', 'manual')),
  duration_ms  INTEGER      CHECK (duration_ms IS NULL OR duration_ms >= 0),
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transcriptions_created_at ON transcriptions (created_at DESC);
