-- ============================================================
-- Migration: Phase 8 - Investor Relations Automation
-- Date: 2026-06-28
-- Description: Local Supabase tables for IR automation
-- Replaces: Airtable (treasure reports), Notion (milestones), SaaS email tools
-- ============================================================

-- ============================================================
-- SECTION 1: TREASURE REPORTS (Weekly/Monthly Treasury Reports)
-- ============================================================

CREATE TABLE IF NOT EXISTS treasure_reports (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_date             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  period_start            TIMESTAMPTZ NOT NULL,
  period_end              TIMESTAMPTZ NOT NULL,
  total_treasury_usd      NUMERIC(15,2) NOT NULL DEFAULT 0,
  xmrt_reserve_usd        NUMERIC(15,2) NOT NULL DEFAULT 0,
  usdf_reserve_usd        NUMERIC(15,2) NOT NULL DEFAULT 0,
  deployed_capital_usd    NUMERIC(15,2) NOT NULL DEFAULT 0,
  available_liquidity_usd NUMERIC(15,2) NOT NULL DEFAULT 0,
  revenue_generated_usd   NUMERIC(15,2) NOT NULL DEFAULT 0,
  distributions_paid_usd  NUMERIC(15,2) NOT NULL DEFAULT 0,
  agent_revenue_attribution JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes                   TEXT,
  status                  TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_treasure_reports_date ON treasure_reports(report_date DESC);
CREATE INDEX idx_treasure_reports_status ON treasure_reports(status);

-- ============================================================
-- SECTION 2: MILESTONES (Achievement Tracking & Announcements)
-- ============================================================

CREATE TABLE IF NOT EXISTS milestones (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  description     TEXT,
  category        TEXT NOT NULL CHECK (category IN ('capital', 'agent', 'infrastructure', 'governance', 'partnership')),
  achieved_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  impact_score    INTEGER DEFAULT 1 CHECK (impact_score >= 1 AND impact_score <= 10),
  announced       BOOLEAN DEFAULT FALSE,
  fleet_chat_msg_id TEXT,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_milestones_category ON milestones(category);
CREATE INDEX idx_milestones_announced ON milestones(announced) WHERE announced = FALSE;
CREATE INDEX idx_milestones_achieved ON milestones(achieved_at DESC);

-- ============================================================
-- SECTION 3: EMAIL DIGESTS (Scheduled Investor Communications)
-- ============================================================

CREATE TABLE IF NOT EXISTS email_digests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  digest_type     TEXT NOT NULL CHECK (digest_type IN ('weekly', 'monthly', 'milestone')),
  subject         TEXT NOT NULL,
  body_html       TEXT,
  body_text       TEXT,
  recipients_count INTEGER DEFAULT 0,
  scheduled_at    TIMESTAMPTZ,
  sent_at         TIMESTAMPTZ,
  status          TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sent', 'failed')),
  error_message   TEXT,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_email_digests_type ON email_digests(digest_type);
CREATE INDEX idx_email_digests_status ON email_digests(status);
CREATE INDEX idx_email_digests_scheduled ON email_digests(scheduled_at) WHERE scheduled_at IS NOT NULL;

-- ============================================================
-- SECTION 4: EMAIL TEMPLATES (Reusable IR Communication Templates)
-- ============================================================

CREATE TABLE IF NOT EXISTS email_templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key    TEXT UNIQUE NOT NULL,
  name            TEXT NOT NULL,
  subject_template TEXT NOT NULL,
  body_template_html TEXT NOT NULL,
  body_template_text TEXT NOT NULL,
  variables       TEXT[] DEFAULT '{}',
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_email_templates_key ON email_templates(template_key);
CREATE INDEX idx_email_templates_active ON email_templates(is_active) WHERE is_active = TRUE;

-- ============================================================
-- SECTION 5: INVESTOR SUBSCRIPTIONS (Email Preferences)
-- ============================================================

CREATE TABLE IF NOT EXISTS investor_subscriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id     UUID NOT NULL REFERENCES investors(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  subscribe_weekly BOOLEAN DEFAULT TRUE,
  subscribe_monthly BOOLEAN DEFAULT TRUE,
  subscribe_milestones BOOLEAN DEFAULT TRUE,
  unsubscribed_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(investor_id)
);

CREATE INDEX idx_investor_subscriptions_email ON investor_subscriptions(email);
CREATE INDEX idx_investor_subscriptions_active ON investor_subscriptions(unsubscribed_at) WHERE unsubscribed_at IS NULL;

-- ============================================================
-- SECTION 6: TRIGGER FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- SECTION 7: TRIGGERS
-- ============================================================

CREATE TRIGGER treasure_reports_updated_at
  BEFORE UPDATE ON treasure_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER milestones_updated_at
  BEFORE UPDATE ON milestones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER email_digests_updated_at
  BEFORE UPDATE ON email_digests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER investor_subscriptions_updated_at
  BEFORE UPDATE ON investor_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- SECTION 8: ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE treasure_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_digests ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE investor_subscriptions ENABLE ROW LEVEL SECURITY;

-- Treasury reports: VC-tier investors can read published reports
CREATE POLICY "VC investors can read published treasure reports"
  ON treasure_reports FOR SELECT
  USING (
    status = 'published' OR 
    EXISTS (
      SELECT 1 FROM investors i 
      WHERE i.investor_tier IN ('vc', 'lead')
      AND i.id = current_setting('app.current_investor_id', TRUE)::UUID
    )
  );

-- Milestones: Everyone can read, only admins can write
CREATE POLICY "Everyone can read milestones"
  ON milestones FOR SELECT
  USING (TRUE);

CREATE POLICY "Admins can manage milestones"
  ON milestones FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM investors i 
      WHERE i.investor_tier = 'lead'
      AND i.id = current_setting('app.current_investor_id', TRUE)::UUID
    )
  );

-- Email digests: Only admins can manage
CREATE POLICY "Admins can manage email digests"
  ON email_digests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM investors i 
      WHERE i.investor_tier = 'lead'
      AND i.id = current_setting('app.current_investor_id', TRUE)::UUID
    )
  );

-- Email templates: Everyone can read active, admins can write
CREATE POLICY "Everyone can read active email templates"
  ON email_templates FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Admins can manage email templates"
  ON email_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM investors i 
      WHERE i.investor_tier = 'lead'
      AND i.id = current_setting('app.current_investor_id', TRUE)::UUID
    )
  );

-- Investor subscriptions: Users can only manage their own
CREATE POLICY "Investors can manage own subscriptions"
  ON investor_subscriptions FOR ALL
  USING (
    investor_id = current_setting('app.current_investor_id', TRUE)::UUID
  );

-- ============================================================
-- SECTION 9: SEED DATA - EMAIL TEMPLATES
-- ============================================================

INSERT INTO email_templates (template_key, name, subject_template, body_template_html, body_template_text, variables) VALUES
('weekly_treasure', 
 'Weekly Treasure Report',
 'XMRT DAO Weekly Treasury Report — {{period_end}}',
 '<html><body>
<h1>XMRT DAO Weekly Treasury Report</h1>
<p>Period: {{period_start}} to {{period_end}}</p>

<h2>Treasury Overview</h2>
<ul>
  <li><strong>Total Treasury:</strong> ${{total_treasury_usd}}</li>
  <li><strong>XMRT Reserve (60%):</strong> ${{xmrt_reserve_usd}}</li>
  <li><strong>USDF Reserve (40%):</strong> ${{usdf_reserve_usd}}</li>
  <li><strong>Deployed Capital:</strong> ${{deployed_capital_usd}}</li>
  <li><strong>Available Liquidity:</strong> ${{available_liquidity_usd}}</li>
</ul>

<h2>Revenue This Period</h2>
<p><strong>Revenue Generated:</strong> ${{revenue_generated_usd}}</p>
<p><strong>Distributions Paid:</strong> ${{distributions_paid_usd}}</p>

<h2>Agent Revenue Attribution</h2>
{{#agent_revenue_attribution}}
<p>{{agent_name}}: ${{revenue_usd}}</p>
{{/agent_revenue_attribution}}

<h2>Notes</h2>
<p>{{notes}}</p>

<hr>
<p><em>XMRT DAO — Privacy-First AI Agent Economy</em></p>
<p><a href="https://xmrtdao.github.io/capitalstack/investors">CapitalStack Dashboard</a></p>
</body></html>',
 'XMRT DAO Weekly Treasury Report
Period: {{period_start}} to {{period_end}}

TREASURY OVERVIEW
- Total Treasury: ${{total_treasury_usd}}
- XMRT Reserve (60%): ${{xmrt_reserve_usd}}
- USDF Reserve (40%): ${{usdf_reserve_usd}}
- Deployed Capital: ${{deployed_capital_usd}}
- Available Liquidity: ${{available_liquidity_usd}}

REVENUE THIS PERIOD
- Revenue Generated: ${{revenue_generated_usd}}
- Distributions Paid: ${{distributions_paid_usd}}

AGENT REVENUE ATTRIBUTION
{{#agent_revenue_attribution}}
- {{agent_name}}: ${{revenue_usd}}
{{/agent_revenue_attribution}}

NOTES
{{notes}}

---
XMRT DAO — Privacy-First AI Agent Economy
CapitalStack Dashboard: https://xmrtdao.github.io/capitalstack/investors',
 ARRAY['period_start', 'period_end', 'total_treasury_usd', 'xmrt_reserve_usd', 'usdf_reserve_usd', 'deployed_capital_usd', 'available_liquidity_usd', 'revenue_generated_usd', 'distributions_paid_usd', 'agent_revenue_attribution', 'notes']),

('milestone_announcement',
 'Milestone Achievement',
 '🎉 XMRT DAO Milestone: {{title}}',
 '<html><body>
<h1>🎉 Milestone Achieved</h1>
<h2>{{title}}</h2>
<p>{{description}}</p>
<p><strong>Category:</strong> {{category}}</p>
<p><strong>Achieved:</strong> {{achieved_at}}</p>
<p><strong>Impact Score:</strong> {{impact_score}}/10</p>
<hr>
<p><em>XMRT DAO — Building the Future of Private Autonomous Capital</em></p>
</body></html>',
 '🎉 MILESTONE ACHIEVED

{{title}}

{{description}}

Category: {{category}}
Achieved: {{achieved_at}}
Impact Score: {{impact_score}}/10

---
XMRT DAO — Building the Future of Private Autonomous Capital',
 ARRAY['title', 'description', 'category', 'achieved_at', 'impact_score']),

('monthly_investor_update',
 'Monthly Investor Update',
 'XMRT DAO Monthly Investor Update — {{month_year}}',
 '<html><body>
<h1>XMRT DAO Monthly Investor Update</h1>
<p>{{month_year}}</p>

<h2>Executive Summary</h2>
<p>{{executive_summary}}</p>

<h2>Capital Deployment</h2>
<p>{{capital_deployment_summary}}</p>

<h2>Agent Economy</h2>
<p>{{agent_economy_summary}}</p>

<h2>Governance Highlights</h2>
<p>{{governance_highlights}}</p>

<h2>Looking Ahead</h2>
<p>{{looking_ahead}}</p>

<hr>
<p><em>Questions? Reply to this email or join the VC Briefing Room:</em></p>
<p><a href="https://xmrtdao.github.io/capitalstack/vc">VC Briefing Room</a></p>
</body></html>',
 'XMRT DAO MONTHLY INVESTOR UPDATE
{{month_year}}

EXECUTIVE SUMMARY
{{executive_summary}}

CAPITAL DEPLOYMENT
{{capital_deployment_summary}}

AGENT ECONOMY
{{agent_economy_summary}}

GOVERNANCE HIGHLIGHTS
{{governance_highlights}}

LOOKING AHEAD
{{looking_ahead}}

---
Questions? Reply to this email or join the VC Briefing Room:
https://xmrtdao.github.io/capitalstack/vc',
 ARRAY['month_year', 'executive_summary', 'capital_deployment_summary', 'agent_economy_summary', 'governance_highlights', 'looking_ahead'])
ON CONFLICT (template_key) DO UPDATE SET
  body_template_html = EXCLUDED.body_template_html,
  body_template_text = EXCLUDED.body_template_text,
  updated_at = NOW();

-- ============================================================
-- END OF MIGRATION
-- ============================================================
