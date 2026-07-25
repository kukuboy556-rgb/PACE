CREATE TABLE IF NOT EXISTS compliance_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  frequency VARCHAR(20) NOT NULL DEFAULT 'Quarterly' CHECK (frequency IN ('Monthly','Quarterly','Semestral','Annual','Ad-hoc')),
  category VARCHAR(50) NOT NULL DEFAULT 'School Form' CHECK (category IN ('School Form','Compliance Report','Division Requirement','Other')),
  division_policy VARCHAR(500),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS compliance_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES compliance_forms(id) ON DELETE CASCADE,
  period_label VARCHAR(100) NOT NULL,
  due_date DATE NOT NULL,
  submitted_at TIMESTAMPTZ,
  submitted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending','On Track','Late','Submitted','Acknowledged')),
  notes TEXT,
  file_url VARCHAR(500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(form_id, period_label)
);

CREATE TABLE IF NOT EXISTS school_form_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_code VARCHAR(50) NOT NULL,
  period_label VARCHAR(100) NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  submitted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(form_code, period_label)
);

CREATE TABLE IF NOT EXISTS sip_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  school_year VARCHAR(20) NOT NULL,
  goal VARCHAR(500) NOT NULL,
  priority_area VARCHAR(100) NOT NULL CHECK (priority_area IN ('Access','Quality','Governance','Equity','Resilience')),
  target_metric VARCHAR(255),
  baseline_value VARCHAR(100),
  target_value VARCHAR(100),
  target_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS aip_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES sip_goals(id) ON DELETE CASCADE,
  activity VARCHAR(500) NOT NULL,
  quarter INTEGER NOT NULL CHECK (quarter BETWEEN 1 AND 4),
  responsible_person VARCHAR(200),
  target_completion DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'Not Started' CHECK (status IN ('Not Started','In Progress','Completed','Delayed','Cancelled')),
  actual_completion DATE,
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sip_budget_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES aip_activities(id) ON DELETE CASCADE,
  fund_source VARCHAR(20) NOT NULL CHECK (fund_source IN ('MOOE','SEF','PTA','LGU','Donation','Other')),
  allocated DECIMAL(12,2) NOT NULL DEFAULT 0,
  obligated DECIMAL(12,2) NOT NULL DEFAULT 0,
  disbursed DECIMAL(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quarterly_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES sip_goals(id) ON DELETE CASCADE,
  quarter INTEGER NOT NULL CHECK (quarter BETWEEN 1 AND 4),
  school_year VARCHAR(20) NOT NULL,
  target_metric VARCHAR(255),
  target_value VARCHAR(100),
  actual_value VARCHAR(100),
  variance_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(goal_id, quarter, school_year)
);

CREATE TABLE IF NOT EXISTS physical_financial_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  school_year VARCHAR(20) NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  fund_source VARCHAR(20) NOT NULL CHECK (fund_source IN ('MOOE','SEF','PTA','LGU','Donation','Other')),
  physical_accomplishment DECIMAL(5,2) DEFAULT 0,
  financial_obligation DECIMAL(12,2) DEFAULT 0,
  financial_disbursement DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(team_id, school_year, month, fund_source)
);

CREATE INDEX IF NOT EXISTS idx_compliance_submissions_form ON compliance_submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_compliance_submissions_status ON compliance_submissions(status);
CREATE INDEX IF NOT EXISTS idx_sip_goals_team ON sip_goals(team_id);
CREATE INDEX IF NOT EXISTS idx_aip_activities_goal ON aip_activities(goal_id);
CREATE INDEX IF NOT EXISTS idx_sip_budget_activity ON sip_budget_lines(activity_id);
CREATE INDEX IF NOT EXISTS idx_pf_status_team ON physical_financial_status(team_id, school_year);
