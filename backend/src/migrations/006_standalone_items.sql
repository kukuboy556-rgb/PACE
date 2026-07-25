CREATE TABLE IF NOT EXISTS standalone_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  collection VARCHAR(50) NOT NULL,
  item_id VARCHAR(255) NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, collection, item_id)
);

CREATE INDEX IF NOT EXISTS idx_standalone_items_user_collection ON standalone_items(user_id, collection);
