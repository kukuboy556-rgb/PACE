CREATE TABLE task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  source VARCHAR(255) NOT NULL DEFAULT 'MOOE',
  amount_allocated DECIMAL(12,2) NOT NULL DEFAULT 0,
  amount_spent DECIMAL(12,2) NOT NULL DEFAULT 0,
  liquidation_status VARCHAR(30) NOT NULL DEFAULT 'For Liquidation'
    CHECK (liquidation_status IN ('For Liquidation', 'Partially Liquidated', 'Liquidated', 'Delayed')),
  notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  type VARCHAR(30) NOT NULL DEFAULT 'info'
    CHECK (type IN ('deadline', 'overdue', 'closure', 'verification', 'info')),
  link VARCHAR(500),
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE beneficiaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  metric VARCHAR(255) NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  period DATE NOT NULL,
  notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX idx_task_comments_user_id ON task_comments(user_id);
CREATE INDEX idx_budgets_project_id ON budgets(project_id);
CREATE INDEX idx_alerts_user_id ON alerts(user_id);
CREATE INDEX idx_alerts_user_unread ON alerts(user_id, is_read);
CREATE INDEX idx_beneficiaries_project_id ON beneficiaries(project_id);
