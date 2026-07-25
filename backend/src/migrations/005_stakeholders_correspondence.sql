CREATE TABLE IF NOT EXISTS stakeholders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  organization VARCHAR(255),
  type VARCHAR(50) NOT NULL DEFAULT 'Community' CHECK (type IN ('Parent','Community','LGU','NGO','Private Sector','SDO','Other')),
  contact_person VARCHAR(255),
  contact_number VARCHAR(50),
  email VARCHAR(255),
  address TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS engagement_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stakeholder_id UUID NOT NULL REFERENCES stakeholders(id) ON DELETE CASCADE,
  engagement_date DATE NOT NULL,
  engagement_type VARCHAR(50) NOT NULL CHECK (engagement_type IN ('Meeting','Orientation','Consultation','Mobilization','Advocacy','Referral','Other')),
  notes TEXT NOT NULL,
  outcome TEXT,
  conducted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS correspondence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('Outgoing','Incoming')),
  date DATE NOT NULL,
  subject VARCHAR(500) NOT NULL,
  recipient_or_sender VARCHAR(255) NOT NULL,
  reference_number VARCHAR(100),
  category VARCHAR(50) NOT NULL DEFAULT 'General' CHECK (category IN ('General','Request','Report','Memo','Endorsement','Transmittal','Others')),
  status VARCHAR(20) NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft','Sent','Received','For Follow-up','Closed','Archived')),
  content TEXT,
  file_url VARCHAR(500),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stakeholders_team ON stakeholders(team_id);
CREATE INDEX IF NOT EXISTS idx_engagement_stakeholder ON engagement_logs(stakeholder_id);
CREATE INDEX IF NOT EXISTS idx_correspondence_team ON correspondence(team_id);
CREATE INDEX IF NOT EXISTS idx_correspondence_status ON correspondence(status);
