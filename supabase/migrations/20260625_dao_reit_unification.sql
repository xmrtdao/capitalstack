-- ============================================================
-- Migration: DAO-REIT Unification
-- Date: 2026-06-25
-- Description: Merges CuttlefishClaws DAO-REIT schema with SUITE
-- Adds: AI agent credentials, capital stack, financing programs,
--       investor tracking, trust graph, constitutional governance
-- ============================================================

-- ============================================================
-- SECTION 1: AI AGENT CREDENTIALS (CAC System)
-- ============================================================

-- CAC credentials: AI agent credential tiers & prepaid balances
-- This is the economic layer for agent work
CREATE TABLE IF NOT EXISTS cac_credentials (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_did       TEXT NOT NULL,
  tier            TEXT NOT NULL CHECK (tier IN ('explorer','developer','studio','enterprise')),
  token_balance   BIGINT DEFAULT 0,
  usdc_prepaid    NUMERIC(12,2) DEFAULT 0,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','active','depleted','expired','exiting','transferred')),
  chain_tx_hash   TEXT,
  issued_at       TIMESTAMPTZ DEFAULT NOW(),
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Link to SUITE's existing auth (if agent is operated by a user)
ALTER TABLE cac_credentials 
ADD COLUMN IF NOT EXISTS operator_user_id UUID REFERENCES auth.users(id);

-- ============================================================
-- SECTION 2: AGENT REGISTRY (Extended)
-- ============================================================

-- Agents table: Registry with trust scores & constitutional status
-- SUITE has agent_tasks; this adds the agent identity layer
CREATE TABLE IF NOT EXISTS agents (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  did               TEXT UNIQUE NOT NULL,
  agent_type        TEXT NOT NULL CHECK (agent_type IN ('constitutional','developer','financial')),
  name              TEXT,
  operator_did      TEXT,
  cac_id            UUID REFERENCES cac_credentials(id),
  trust_score       NUMERIC(5,2) DEFAULT 50.0 CHECK (trust_score >= 0 AND trust_score <= 100),
  status            TEXT DEFAULT 'pending' CHECK (status IN ('pending','active','suspended','decommissioned')),
  constitution_hash TEXT,
  metadata          JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Link to SUITE's user system
ALTER TABLE agents 
ADD COLUMN IF NOT EXISTS operator_user_id UUID REFERENCES auth.users(id);

-- ============================================================
-- SECTION 3: CONSTITUTIONAL GOVERNANCE
-- ============================================================

-- Proposals: Constitutional governance with versioning & routing
CREATE TABLE IF NOT EXISTS proposals (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title            TEXT NOT NULL,
  description      TEXT,
  category         TEXT DEFAULT 'general',
  submitter_did    TEXT NOT NULL,
  version          INTEGER DEFAULT 1 CHECK (version >= 1),
  parent_id        UUID REFERENCES proposals(id),
  status           TEXT DEFAULT 'submitted' CHECK (
                     status IN ('submitted','routing','under_review','approved','rejected','archived')
                   ),
  ipfs_cid         TEXT,
  arweave_tx       TEXT,
  chain_anchor_tx  TEXT,
  combined_hash    TEXT NOT NULL,
  routed_to        TEXT[] DEFAULT '{}',
  trust_score_delta NUMERIC(5,2),
  metadata         JSONB DEFAULT '{}',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Votes: Track governance decisions
CREATE TABLE IF NOT EXISTS proposal_votes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id     UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  voter_did       TEXT NOT NULL,
  voter_type      TEXT NOT NULL CHECK (voter_type IN ('human','agent','investor')),
  vote            TEXT NOT NULL CHECK (vote IN ('for','against','abstain')),
  weight          NUMERIC(12,4) DEFAULT 1.0,
  rationale       TEXT,
  ipfs_cid        TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(proposal_id, voter_did)
);

-- ============================================================
-- SECTION 4: TRUST GRAPH (Append-Only Event Log)
-- ============================================================

-- Trust events: Immutable reputation tracking
CREATE TABLE IF NOT EXISTS trust_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_did    TEXT NOT NULL,
  event_type   TEXT NOT NULL,
  delta        NUMERIC(5,2) NOT NULL,
  score_after  NUMERIC(5,2) NOT NULL CHECK (score_after >= 0 AND score_after <= 100),
  reference    TEXT,
  note         TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SECTION 5: AGENT TASK QUEUE (Merge with SUITE's agent_tasks)
-- ============================================================

-- SUITE already has agent_tasks - we extend it with Cuttlefish fields
-- Add Cuttlefish-specific columns to existing table
ALTER TABLE agent_tasks 
ADD COLUMN IF NOT EXISTS assigned_to TEXT CHECK (assigned_to IN ('trib','arch','nautiloid','dao-voters','fleet'));

ALTER TABLE agent_tasks 
ADD COLUMN IF NOT EXISTS priority INTEGER CHECK (priority >= 1 AND priority <= 10);

ALTER TABLE agent_tasks 
ADD COLUMN IF NOT EXISTS picked_at TIMESTAMPTZ;

-- Create view for Cuttlefish-style task queries
CREATE OR REPLACE VIEW agent_task_queue AS
SELECT 
  id,
  objective as task_type,
  COALESCE(assigned_to, 'fleet') as assigned_to,
  context as payload,
  status,
  priority,
  error as error_msg,
  created_at,
  picked_at,
  completed_at
FROM agent_tasks
ORDER BY priority ASC, created_at ASC;

-- ============================================================
-- SECTION 6: CAPITAL STACK (DAO-REIT Financing)
-- ============================================================

-- Capital stack layers: $34M total financing structure
CREATE TABLE IF NOT EXISTS capital_stack (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  layer_key     TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  sub_label     TEXT NOT NULL,
  amount_m      NUMERIC(10,4) NOT NULL,
  pct_of_total  NUMERIC(6,3) NOT NULL,
  color         TEXT NOT NULL,
  seniority     NUMERIC(4,3) NOT NULL,
  yield_score   NUMERIC(4,3) NOT NULL,
  coverage      NUMERIC(4,3) NOT NULL,
  description   TEXT,
  details       TEXT,
  display_order INTEGER DEFAULT 0,
  is_open       BOOLEAN DEFAULT FALSE,
  is_active     BOOLEAN DEFAULT TRUE,
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Capital contributions: Track actual investments
CREATE TABLE IF NOT EXISTS capital_contributions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  layer_key         TEXT NOT NULL REFERENCES capital_stack(layer_key),
  investor_id       UUID,
  investor_wallet   TEXT,
  amount_usd        NUMERIC(12,2) NOT NULL,
  tokens_issued     NUMERIC(18,8),
  contribution_date TIMESTAMPTZ DEFAULT NOW(),
  chain_tx_hash     TEXT,
  status            TEXT DEFAULT 'pending' CHECK (status IN ('pending','confirmed','distributed')),
  metadata          JSONB DEFAULT '{}'
);

-- Capital drawdowns: Track financing utilization
CREATE TABLE IF NOT EXISTS capital_drawdowns (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  layer_key         TEXT NOT NULL REFERENCES capital_stack(layer_key),
  program_key       TEXT,
  amount_usd        NUMERIC(12,2) NOT NULL,
  purpose           TEXT,
  requested_by      UUID,
  approved_by       UUID,
  status            TEXT DEFAULT 'requested' CHECK (status IN ('requested','approved','disbursed','rejected')),
  requested_at      TIMESTAMPTZ DEFAULT NOW(),
  approved_at       TIMESTAMPTZ,
  disbursed_at      TIMESTAMPTZ,
  metadata          JSONB DEFAULT '{}'
);

-- ============================================================
-- SECTION 7: FINANCING PROGRAMS (17 Federal/State Programs)
-- ============================================================

-- Financing programs: Database of available funding sources
CREATE TABLE IF NOT EXISTS financing_programs (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_key          TEXT UNIQUE NOT NULL,
  name                 TEXT NOT NULL,
  category             TEXT NOT NULL,
  administering_entity TEXT NOT NULL,
  applies_to           TEXT[] NOT NULL,
  headline             TEXT NOT NULL,
  amount_range         TEXT,
  rate_or_credit       TEXT,
  term_years           TEXT,
  eligibility          TEXT,
  application_url      TEXT,
  contact              TEXT,
  notes                TEXT,
  is_active            BOOLEAN DEFAULT TRUE,
  display_order        INTEGER DEFAULT 0,
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- Program applications: Track which programs we've applied for
CREATE TABLE IF NOT EXISTS program_applications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_key       TEXT NOT NULL REFERENCES financing_programs(program_key),
  status            TEXT DEFAULT 'researching' CHECK (status IN ('researching','preparing','submitted','under_review','approved','rejected','withdrawn')),
  applied_at        TIMESTAMPTZ,
  decision_at       TIMESTAMPTZ,
  award_amount      NUMERIC(12,2),
  notes             TEXT,
  metadata          JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SECTION 8: INVESTOR MANAGEMENT
-- ============================================================

-- Investors: Accredited investor registry
CREATE TABLE IF NOT EXISTS investors (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID REFERENCES auth.users(id),
  name                  TEXT NOT NULL,
  email                 TEXT UNIQUE,
  wallet_address        TEXT UNIQUE,
  accreditation_type    TEXT CHECK (accreditation_type IN ('individual','institutional','family_office','fund')),
  accreditation_verified BOOLEAN DEFAULT FALSE,
  kyc_status            TEXT DEFAULT 'pending' CHECK (kyC_status IN ('pending','verified','rejected','expired')),
  investor_tier         TEXT DEFAULT 'standard' CHECK (investor_tier IN ('standard','vc','lead')),
  vc_code               TEXT UNIQUE,
  vc_code_expires_at    TIMESTAMPTZ,
  metadata              JSONB DEFAULT '{}',
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- Investor access sessions: Track VC code usage
CREATE TABLE IF NOT EXISTS investor_access_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id     UUID REFERENCES investors(id),
  vc_code_used    TEXT NOT NULL,
  session_token   TEXT UNIQUE NOT NULL,
  expires_at      TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Distributions: Pro-rata return calculations
CREATE TABLE IF NOT EXISTS distribution_records (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id       UUID NOT NULL REFERENCES investors(id),
  period_start      TIMESTAMPTZ NOT NULL,
  period_end        TIMESTAMPTZ NOT NULL,
  pro_rata_share    NUMERIC(12,8) NOT NULL,
  distribution_usd  NUMERIC(12,2),
  distribution_xmr  NUMERIC(18,8),
  status            TEXT DEFAULT 'calculated' CHECK (status IN ('calculated','pending','paid')),
  paid_at           TIMESTAMPTZ,
  chain_tx_hash     TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SECTION 9: INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_agents_did          ON agents(did);
CREATE INDEX IF NOT EXISTS idx_agents_status       ON agents(status);
CREATE INDEX IF NOT EXISTS idx_agents_operator     ON agents(operator_user_id);
CREATE INDEX IF NOT EXISTS idx_cac_agent_did       ON cac_credentials(agent_did);
CREATE INDEX IF NOT EXISTS idx_cac_status          ON cac_credentials(status);
CREATE INDEX IF NOT EXISTS idx_proposals_submitter ON proposals(submitter_did);
CREATE INDEX IF NOT EXISTS idx_proposals_status    ON proposals(status);
CREATE INDEX IF NOT EXISTS idx_trust_events_did    ON trust_events(agent_did);
CREATE INDEX IF NOT EXISTS idx_trust_events_created ON trust_events(created_at);
CREATE INDEX IF NOT EXISTS idx_capital_order       ON capital_stack(display_order);
CREATE INDEX IF NOT EXISTS idx_capital_active      ON capital_stack(is_active);
CREATE INDEX IF NOT EXISTS idx_financing_order     ON financing_programs(display_order);
CREATE INDEX IF NOT EXISTS idx_financing_active    ON financing_programs(is_active);
CREATE INDEX IF NOT EXISTS idx_investors_wallet    ON investors(wallet_address);
CREATE INDEX IF NOT EXISTS idx_investors_vc_code   ON investors(vc_code);
CREATE INDEX IF NOT EXISTS idx_contributions_layer ON capital_contributions(layer_key);
CREATE INDEX IF NOT EXISTS idx_drawdowns_layer     ON capital_drawdowns(layer_key);
CREATE INDEX IF NOT EXISTS idx_distributions_investor ON distribution_records(investor_id);

-- ============================================================
-- SECTION 10: ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all new tables
ALTER TABLE cac_credentials    ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents             ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals          ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_votes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_events       ENABLE ROW LEVEL SECURITY;
ALTER TABLE capital_stack      ENABLE ROW LEVEL SECURITY;
ALTER TABLE capital_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE capital_drawdowns  ENABLE ROW LEVEL SECURITY;
ALTER TABLE financing_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE investors          ENABLE ROW LEVEL SECURITY;
ALTER TABLE investor_access_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE distribution_records ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role full access" ON cac_credentials FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON agents FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON proposals FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON proposal_votes FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON trust_events FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON capital_stack FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON capital_contributions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON capital_drawdowns FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON financing_programs FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON program_applications FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON investors FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON investor_access_sessions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON distribution_records FOR ALL USING (auth.role() = 'service_role');

-- Public read policies (transparent DAO)
CREATE POLICY "Public read capital stack" ON capital_stack FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public read financing programs" ON financing_programs FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public read trust events" ON trust_events FOR SELECT USING (true);
CREATE POLICY "Public read proposals" ON proposals FOR SELECT USING (status != 'archived');

-- Authenticated users can read agents
CREATE POLICY "Auth users read agents" ON agents FOR SELECT USING (auth.role() = 'authenticated');

-- Investors can read their own data
CREATE POLICY "Investors read own data" ON investors FOR SELECT 
  USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Investors read own distributions" ON distribution_records FOR SELECT 
  USING (auth.uid() = investor_id OR auth.role() = 'service_role');

-- ============================================================
-- SECTION 11: TRIGGERS (updated_at)
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER agents_updated_at
  BEFORE UPDATE ON agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER proposals_updated_at
  BEFORE UPDATE ON proposals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER capital_stack_updated_at
  BEFORE UPDATE ON capital_stack
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER financing_programs_updated_at
  BEFORE UPDATE ON financing_programs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER investors_updated_at
  BEFORE UPDATE ON investors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- SECTION 12: SEED DATA - CAPITAL STACK
-- ============================================================

INSERT INTO capital_stack (layer_key, name, sub_label, amount_m, pct_of_total, color, seniority, yield_score, coverage, description, details, display_order, is_open) VALUES
('cpace',
 'C-PACE', 'Senior Retrofit Lien', 25.5, 75.0, '#00c8ff', 0.88, 0.72, 0.92,
 'No personal guarantee · Transfers with property · 25-30yr term · Senior assessment lien',
 'C-PACE finances the $25.5M energy retrofit through a voluntary property tax assessment under Alabama SB220 (2016). Senior lien. Transfers automatically at property sale. 5-10% interest over 25-30 years. Covers solar reactivation, HVAC electrification, EV charging, building automation, and energy storage.',
 1, FALSE),
('sba_private',
 'SBA Private', '1st Lien · ~50% LTV', 2.75, 8.0, '#ffbb33', 0.70, 0.60, 0.75,
 '~50% LTV · First lien position · Private bank · Standard SBA 504 structure',
 'Private lender first lien at approximately 50% loan-to-value. Part of SBA 504 three-part structure: private lender (50%) + CDC debenture (40%) + borrower equity (10%). Collateral limited to property.',
 2, FALSE),
('sba_cdc',
 'SBA 504', '2nd Lien · CDC Debenture', 2.2, 6.5, '#ffbb33', 0.60, 0.68, 0.65,
 '25-yr fixed 6.44% · Government-backed · 2nd lien · No personal guarantee',
 'SBA 504 CDC debenture at 6.44% fixed for 25 years (April 2026 NADCO rate). SBA-guaranteed. Alabama CDCs: FBDC, Alabama Small Business Capital. AI equipment explicitly eligible under SBA 2024 guidance.',
 3, FALSE),
('dao_reit',
 'DAO-REIT', 'Equity · Open Now', 0.55, 1.6, '#ff00cc', 0.28, 0.95, 0.30,
 '10% equity down · Tokenized via Delaware Series LLC · DAO governance · Min $25K',
 '$550K equity tranche tokenized via Delaware Series LLC. Minimum $25K. AI agents invest via Coinbase AgentKit wallets. Birmingham Opportunity Zone — federal capital gains deferral and elimination available (OZ 1.0 through Dec 2028). Alabama state OZ match via ADECA ($50M cap).',
 4, TRUE),
('founder',
 'Founder', 'Equity Floor · Subordinate', 0.055, 0.18, '#00ff88', 0.18, 1.00, 0.20,
 'Delaware Series LLC · No personal guarantee beyond this position · Fully subordinate',
 'Founder equity floor — $55K at risk. Delaware Series LLC isolates asset from Cuttlefish Labs operating entity. No personal guarantee beyond this position. FounderShare.sol: 6-trigger constitutional veto.',
 5, FALSE)
ON CONFLICT (layer_key) DO UPDATE SET
  description = EXCLUDED.description,
  details     = EXCLUDED.details,
  updated_at  = NOW();

-- ============================================================
-- SECTION 13: SEED DATA - FINANCING PROGRAMS (17 programs)
-- ============================================================

INSERT INTO financing_programs
(program_key, name, category, administering_entity, applies_to, headline, amount_range, rate_or_credit, term_years, eligibility, application_url, contact, notes, display_order)
VALUES
('sba_504','SBA 504 Loan Program','federal_loan','U.S. Small Business Administration — Certified Development Companies',ARRAY['sba_cdc','sba_private'],'Below-market fixed-rate financing for commercial real estate and AI infrastructure','Up to $5.5M CDC debenture; no cap on private lender 50%','6.44% fixed 25-yr (April 2026 NADCO)','10, 20, or 25 years','For-profit US company. Net worth <$20M. Avg net income <$6.5M/2yr. 10% borrower equity. Owner-occupied CRE. AI-supported equipment explicitly eligible (SBA 2024). Data centers min 20 net new jobs.','https://www.sba.gov/funding-programs/loans/504-loans','Alabama CDCs: FBDC (fbdc.net, 205-324-7244) · Alabama Small Business Capital','Three-part structure: 50% private lender + 40% CDC debenture (SBA-guaranteed) + 10% equity. Birmingham OZ location may qualify for enhanced terms. Apply before public announcement.',10),

('doe_loan_program','DOE Loan Programs Office (LPO) — Title 17','federal_loan','U.S. Department of Energy — Loan Programs Office',ARRAY['cpace','dao_reit'],'Loan guarantees for innovative clean energy and brownfield AI+energy deployments','$1M to multi-billion; project-specific','Below-market; Treasury-indexed','5–30 years','Innovative clean energy technology. Brownfield redevelopment with clean energy component. C-PACE retrofit + solar + battery storage on former telecom facility is strong candidate.','https://www.energy.gov/lpo/loan-programs-office','DOE LPO: lpo.energy.gov','July 2025 EO directs Commerce to launch financial support for AI data centers. LPO pipeline is 1-2 years — apply early.',11),

('alabama_infra_bank','Alabama Infrastructure Bank (Powering Growth Act)','state_loan','Alabama Department of Commerce / EDPA',ARRAY['cpace','dao_reit'],'Flexible financing for power infrastructure tied to industrial growth — signed into law 2025','Project-specific; no stated cap at launch','Below-market; bond-financed','Project-specific','Industrial projects requiring power infrastructure in Alabama. Tributary campus power upgrade tied to AI campus job creation. New program — early engagement critical.','https://edpa.org/','EDPA: edpa.org · (205) 943-4700','Brand new 2025 program. EDPA and AL Dept of Commerce co-administering. Birmingham/Jefferson County OZ designation is an advantage.',20),

('al_industrial_dev_bonds','Alabama Industrial Development Bond Program','state_loan','State Industrial Development Authority / Jefferson County IDB',ARRAY['sba_private','dao_reit'],'Tax-exempt bond financing — no ad valorem tax on financed property','Project-specific','Tax-exempt; below-market','10–30 years','Industrial and technology projects via local Industrial Development Boards. No ad valorem tax on land/buildings/equipment financed by bonds. Sales & Use Tax exemptions apply.','https://edpa.org/','Jefferson County IDB · Birmingham Business Alliance: (205) 324-2100','Alabama Act 91-635. Coordinate with Jefferson County Commission and City of Birmingham. Can layer with SBA 504 and C-PACE.',21),

('alabama_jobs_act','Alabama Jobs Act — Jobs Credit + Investment Credit','state_tax','Alabama Department of Commerce + Alabama Department of Revenue',ARRAY['dao_reit','founder'],'3-4% annual payroll rebate + 1.5% investment credit; data centers get 30-yr property tax abatement','3-4% of payroll/yr × 10yr + 1.5% of capex/yr × 10yr','Cash rebate + tax credit','10yr credits; up to 30yr data center property tax abatement','Min 20 net new jobs for data centers (vs standard 50). Technology companies eligible for 4% rate. Jefferson County is not a targeted county — standard rate. MUST apply before public announcement.','https://www.madeinalabama.com/why-alabama/incentives/','AL Dept of Commerce: (334) 242-0400 · Birmingham Business Alliance: (205) 324-2100','Data processing centers get 30-year property tax abatement (vs standard 20yr). Cannot stack with 40-9G — choose one. Transferable investment credit first 3 years (85% min value). Apply BEFORE public announcement.',30),

('al_reinvestment_abatements','Alabama Reinvestment and Abatements Act (40-9G)','state_tax','Alabama Department of Revenue',ARRAY['cpace','sba_private'],'Sales/use and property tax abatements for existing facility upgrade — no minimum job requirement','Full abatement of non-educational sales/use and property taxes','Full abatement','Up to 20yr property tax; 10yr utility tax','Existing facility refurbishment or placed back in service. Min $2M capital investment. No minimum job count. Cannot stack with Jobs Act — choose one.','https://www.revenue.alabama.gov/division/tax-incentives/','AL Dept of Revenue: (334) 242-1175','Best fit for Tributary: placed back in service category. No job minimum. Utility tax exemption covers AI compute electricity loads. Coordinate approvals with Jefferson County and City of Birmingham.',31),

('al_oz_match','Alabama Incentives and Modernization Act — OZ Impact Investment Credit','state_tax','Alabama Department of Economic & Community Affairs (ADECA)',ARRAY['dao_reit'],'State income tax credit if OZ investment underperforms agreed return — downside protection','$50M aggregate state program cap','Impact Investment Credit vs AL income/excise taxes','Per ADECA project agreement','Investment in ADECA-approved Opportunity Fund investing in Alabama OZ project. File IRS Form 8996. Project agreement with ADECA required.','https://adeca.alabama.gov/opportunityzones/','ADECA: (334) 242-5100','$50M cap is statewide aggregate — early movers advantaged. Confirm 2025/2026 availability with ADECA. Layerable on top of federal OZ §1400Z-2 benefits.',32),

('growing_alabama','Growing Alabama Credit Program','state_tax','Alabama Department of Commerce + EDPA',ARRAY['dao_reit','cpace'],'Dollar-for-dollar state tax credit for contributions to EDPA-approved projects','Up to 50% of taxpayer AL tax liability','Dollar-for-dollar state tax credit','Per project','Alabama taxpayers with state tax liability. Contributions to approved Economic Development Organizations. Coordinate with Birmingham Business Alliance or Jefferson County EDO.','https://edpa.org/programs-services/state-tax-incentive-programs/','EDPA: (205) 943-4700','Converts Alabama tax liability into Tributary project capital. Maximum 50% of AL tax liability per year. Must coordinate with local EDO.',33),

('oz_federal','Qualified Opportunity Zone — Federal (IRC §1400Z-2)','federal_tax','U.S. Treasury / IRS',ARRAY['dao_reit','founder'],'Defer and eliminate capital gains by investing in Birmingham OZ via Qualified Opportunity Fund','No minimum; Tributary DAO-REIT min $25K','Full gains elimination after 10yr hold','OZ 1.0 through Dec 31, 2028; OZ 2.0 effective Jan 1, 2027','US taxpayer with eligible capital gains. Invest via QOF within 180 days of gain. Property in designated OZ census tract. Birmingham: 24 OZs. Hold ≥10 years for full elimination.','https://opportunityzones.com/cities/birmingham-alabama/','Opportunity Alabama (OPAL): opportunityalabama.com · IRS: irs.gov/credits-deductions/opportunity-zones','OZ 2.0 (OBBBA July 2025): program made permanent. New designations ~141 Alabama tracts effective Jan 1, 2027. Confirm Tributary campus census tract vs IRS Notice 2018-48.',40),

('itc_48','Investment Tax Credit — IRC §48','federal_tax','U.S. Internal Revenue Service / U.S. Treasury',ARRAY['cpace'],'30% federal tax credit on solar, battery storage, EV charging — up to 50% with bonus adders','No cap — 30% of eligible project cost base','30% base; +10% energy community; +10% domestic content','Credit taken year placed in service','Solar PV, battery storage ≥5kWh, EV charging, fuel cells. Birmingham potentially qualifies as energy community — 10% bonus. Prevailing wage + apprenticeship for projects >1MW.','https://www.irs.gov/credits-deductions/businesses/investment-tax-credit','IRS: irs.gov · DOE: energy.gov/policy/clean-energy-tax-incentives','$25.5M C-PACE project at 30% ITC = ~$7.65M federal credit. Requires tax equity partner or direct pay election (IRC §6417). ITC stacks on top of C-PACE.',41),

('bonus_depreciation','Bonus Depreciation / MACRS Accelerated (IRC §168)','federal_tax','U.S. Internal Revenue Service',ARRAY['sba_private','dao_reit'],'100% bonus depreciation on qualifying equipment — restored by OBBBA July 2025','Full cost basis of qualifying assets','100% depreciation year 1','Year placed in service','Equipment with useful life ≤20 years, Qualified Improvement Property. Data center equipment (servers, networking, power, HVAC) qualifies. Restored to 100% by OBBBA for assets placed in service after Jan 20, 2025.','https://www.irs.gov/newsroom/bonus-depreciation','IRS: irs.gov/publications/p946','OBBBA (July 2025) restored 100% bonus depreciation. All data center equipment and QIP can be fully depreciated year 1. Dramatically accelerates tax shield for DAO-REIT investors.',42),

('eda_public_works','EDA Public Works & Economic Adjustment Assistance','federal_grant','U.S. Economic Development Administration (Dept of Commerce)',ARRAY['cpace','dao_reit'],'Competitive grants for infrastructure in distressed communities — brownfield redevelopment covered','$100K–$10M+ competitive','Grant (no repayment)','No repayment','Eligible: Economic Development Districts, state/local government, nonprofits, universities. NOT direct to for-profit. Partner with City of Birmingham or Jefferson County as co-applicant. Birmingham qualifies as distressed area.','https://www.eda.gov/funding/funding-opportunities/all-opportunities','EDA Atlanta Regional Office: (404) 730-3002','$466M FY2026 EDA appropriation. Apply via grants.gov. City of Birmingham or Jefferson County must be the applicant — Cuttlefish Labs is private partner.',50),

('eda_tech_hubs','EDA Tech Hubs Program — Phase 2 Implementation Grants','federal_grant','U.S. Economic Development Administration',ARRAY['dao_reit'],'$220M for regions to become globally competitive in critical technologies','Up to $75M per hub','Grant (no repayment)','Multi-year','Only 19 designated Tech Hubs eligible for Phase 2. Check if Alabama/Birmingham is designated. Stage II deadline Feb 18, 2026.','https://www.eda.gov/funding/programs/tech-hubs','EDA: eda.gov/funding/programs/tech-hubs','If Birmingham is not a designated Hub, support Alabama designation bid. Tributary campus as anchor asset strengthens any Alabama Tech Hub proposal.',51),

('doe_better_buildings','DOE Better Buildings Initiative + C-PACE Navigator','federal_grant','U.S. Department of Energy — SCEP',ARRAY['cpace'],'Free technical assistance and competitive grants for commercial clean energy retrofits','Technical assistance free; grants $50K–$5M typical','Grant / free TA','Project-specific','Commercial property owners pursuing energy efficiency or renewable energy improvements. Alabama DOE region.','https://betterbuildingssolutioncenter.energy.gov/financing-navigator/option/cpace','DOE Better Buildings: 1-877-337-3463','DOE C-PACE navigator tool is free. Useful for establishing C-PACE precedent with Jefferson County. Joining Better Buildings Challenge provides national recognition.',52),

('epa_brownfields','EPA Brownfields Assessment and Cleanup Grants','federal_grant','U.S. Environmental Protection Agency',ARRAY['cpace','dao_reit'],'Grants for Phase I/II environmental assessments and cleanup — former telecom facility may qualify','Assessment: up to $500K. Cleanup: up to $500K. Multi-purpose: up to $1M.','Grant (no repayment)','Project-specific','Eligible: local governments, nonprofits, quasi-governmental. City of Birmingham or Jefferson County applies. Former telecom/industrial facility qualifies as brownfield.','https://www.epa.gov/brownfields/types-brownfields-grant-funding','EPA Region 4: (404) 562-9900','Phase I/II environmental assessments are prerequisite for C-PACE and federal programs. Apply through City of Birmingham as co-applicant.',53),

('dc_eo_ai','Presidential EO — Accelerating Data Center Infrastructure (July 23, 2025)','federal_grant','U.S. Department of Commerce + DOE + DOI',ARRAY['cpace','dao_reit'],'Federal financial support initiative for AI data centers: loans, grants, tax incentives, offtake agreements','TBD — Commerce initiative launching 2025-2026','Program-specific','Program-specific','AI data centers. Commerce initiative may cover brownfield conversions. Federal lands and brownfield sites prioritized. NEPA streamlined for projects where federal assistance <50% of total cost.','https://www.whitehouse.gov/presidential-actions/2025/07/accelerating-federal-permitting-of-data-center-infrastructure/','Dept of Commerce: commerce.gov · FAST-41: permits.performance.gov','EO signed July 23, 2025. Register project with FPISC for FAST-41 designation — streamlines permitting. Tributary is a strong fit: brownfield, AI infrastructure, OZ location, clean energy.',54),

('aidt_workforce','AIDT — Alabama Industrial Development Training','state_program','AIDT (Alabama Department of Commerce)',ARRAY['dao_reit','founder'],'Free customized workforce training for qualifying Alabama industries','Full cost of training at no charge to employer','Free (state-funded)','Ongoing','New or expanding Alabama industry. Data center projects min 20 jobs. AI/technology operations training available. AIDT is ISO 9001:2015 certified.','https://aidt.edu/','AIDT: (334) 244-1885','Often called Alabama''s #1 incentive. Design curriculum for AI campus operations, constitutional AI governance, agent management. Zero cost. Coordinate early.',60)
ON CONFLICT (program_key) DO UPDATE SET
  notes      = EXCLUDED.notes,
  updated_at = NOW();

-- ============================================================
-- END OF MIGRATION
-- ============================================================
