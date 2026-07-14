-- =============================================================================
-- EcoSphere — Production PostgreSQL Schema (Step 1)
-- =============================================================================
-- Design principles:
--   • UUID primary keys (gen_random_uuid)
--   • TIMESTAMPTZ for all temporal columns
--   • NUMERIC(10, 2) for carbon emission totals (kg CO2e)
--   • Higher precision NUMERIC(18, 8) for emission factors (calculation inputs)
--   • ON DELETE CASCADE for tenant-scoped child records
--   • CHECK constraints for non-negative emissions and positive quantities
--   • B-Tree + composite indexes optimized for ESG analytics workloads
-- =============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- ENUM TYPES
-- -----------------------------------------------------------------------------
CREATE TYPE role AS ENUM (
  'super_admin', 'org_admin', 'esg_manager', 'dept_head', 'auditor', 'employee'
);

CREATE TYPE approval_status AS ENUM (
  'draft', 'submitted', 'approved', 'rejected', 'cancelled'
);

CREATE TYPE approval_entity_type AS ENUM (
  'csr_activity', 'carbon_transaction', 'challenge_participation',
  'reward_redemption', 'resource_consumption', 'framework_metric', 'dei_snapshot'
);

CREATE TYPE approval_stage_status AS ENUM (
  'pending', 'approved', 'rejected', 'skipped'
);

CREATE TYPE carbon_scope AS ENUM ('scope_1', 'scope_2', 'scope_3');

CREATE TYPE resource_type AS ENUM ('energy', 'water');

CREATE TYPE compliance_framework AS ENUM ('brsr', 'gri', 'csrd');

CREATE TYPE ledger_entry_type AS ENUM ('credit', 'debit');

CREATE TYPE challenge_status AS ENUM ('draft', 'active', 'completed', 'cancelled');

CREATE TYPE compliance_issue_status AS ENUM (
  'open', 'in_progress', 'resolved', 'closed', 'escalated'
);

CREATE TYPE esg_domain AS ENUM ('environmental', 'social', 'governance');

CREATE TYPE notification_type AS ENUM (
  'approval_required', 'approval_decision', 'badge_earned', 'reward_redeemed',
  'compliance_overdue', 'report_ready', 'policy_published'
);

CREATE TYPE report_pipeline_status AS ENUM (
  'queued', 'extracting', 'transforming', 'validating', 'completed', 'failed'
);

-- -----------------------------------------------------------------------------
-- CORE TENANCY & IDENTITY
-- -----------------------------------------------------------------------------
CREATE TABLE organizations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         VARCHAR(200) NOT NULL,
  slug         VARCHAR(100) NOT NULL,
  industry     VARCHAR(100) NOT NULL,
  country      VARCHAR(100) NOT NULL,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT organizations_slug_unique UNIQUE (slug)
);

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) NOT NULL,
  password_hash TEXT NOT NULL,
  first_name    VARCHAR(100) NOT NULL,
  last_name     VARCHAR(100) NOT NULL,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT users_email_unique UNIQUE (email)
);

CREATE TABLE refresh_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT refresh_tokens_token_hash_unique UNIQUE (token_hash)
);

CREATE TABLE password_reset_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT password_reset_tokens_hash_unique UNIQUE (token_hash)
);

CREATE TABLE departments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            VARCHAR(150) NOT NULL,
  code            VARCHAR(50) NOT NULL,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT departments_org_code_unique UNIQUE (organization_id, code)
);

CREATE TABLE user_roles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role            role NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  department_id   UUID REFERENCES departments(id) ON DELETE CASCADE,
  valid_from      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_to        TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_roles_unique_assignment UNIQUE (user_id, role, organization_id, department_id)
);

-- -----------------------------------------------------------------------------
-- ENVIRONMENTAL — CARBON & EMISSION FACTORS
-- -----------------------------------------------------------------------------
CREATE TABLE emission_factors (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            VARCHAR(200) NOT NULL,
  category        VARCHAR(100) NOT NULL,
  scope           carbon_scope NOT NULL DEFAULT 'scope_2',
  unit            VARCHAR(50) NOT NULL,
  factor_value    NUMERIC(18, 8) NOT NULL,
  effective_from  TIMESTAMPTZ NOT NULL,
  effective_to    TIMESTAMPTZ,
  source          VARCHAR(200) NOT NULL,
  created_by_id   UUID NOT NULL REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT emission_factors_positive CHECK (factor_value > 0)
);

CREATE TABLE carbon_transactions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  department_id         UUID NOT NULL REFERENCES departments(id),
  submitted_by_id       UUID NOT NULL REFERENCES users(id),
  scope                 carbon_scope NOT NULL,
  activity_type         VARCHAR(100) NOT NULL,
  quantity              NUMERIC(10, 2) NOT NULL,
  unit                  VARCHAR(50) NOT NULL,
  emission_factor_id    UUID NOT NULL REFERENCES emission_factors(id),
  snapshot_factor_value NUMERIC(18, 8) NOT NULL,
  snapshot_factor_unit  VARCHAR(50) NOT NULL,
  co2e_kg               NUMERIC(10, 2) NOT NULL,
  activity_date         TIMESTAMPTZ NOT NULL,
  description           TEXT,
  evidence_file_key     VARCHAR(500),
  status                approval_status NOT NULL DEFAULT 'draft',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT carbon_transactions_quantity_positive CHECK (quantity > 0),
  CONSTRAINT carbon_transactions_co2e_nonnegative CHECK (co2e_kg >= 0)
);

CREATE TABLE carbon_ledger (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  department_id   UUID REFERENCES departments(id),
  user_id         UUID REFERENCES users(id),
  entry_type      ledger_entry_type NOT NULL,
  co2e_kg         NUMERIC(10, 2) NOT NULL,
  source_type     VARCHAR(100) NOT NULL,
  source_id       UUID NOT NULL,
  description     TEXT,
  recorded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT carbon_ledger_co2e_positive CHECK (co2e_kg > 0),
  CONSTRAINT carbon_ledger_idempotent UNIQUE (source_type, source_id, entry_type)
);

CREATE TABLE carbon_scope_breakdown (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  period_start    TIMESTAMPTZ NOT NULL,
  period_end      TIMESTAMPTZ NOT NULL,
  scope_1_kg      NUMERIC(10, 2) NOT NULL DEFAULT 0,
  scope_2_kg      NUMERIC(10, 2) NOT NULL DEFAULT 0,
  scope_3_kg      NUMERIC(10, 2) NOT NULL DEFAULT 0,
  calculated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT carbon_scope_breakdown_nonnegative CHECK (
    scope_1_kg >= 0 AND scope_2_kg >= 0 AND scope_3_kg >= 0
  ),
  CONSTRAINT carbon_scope_breakdown_period_unique UNIQUE (organization_id, period_start, period_end)
);

CREATE TABLE resource_consumption_ledger (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  department_id     UUID NOT NULL REFERENCES departments(id),
  submitted_by_id   UUID NOT NULL REFERENCES users(id),
  resource_type     resource_type NOT NULL,
  quantity          NUMERIC(10, 2) NOT NULL,
  unit              VARCHAR(50) NOT NULL,
  consumption_date  TIMESTAMPTZ NOT NULL,
  document_hash     VARCHAR(128) NOT NULL,
  document_file_key VARCHAR(500),
  description       TEXT,
  status            approval_status NOT NULL DEFAULT 'submitted',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT resource_consumption_quantity_positive CHECK (quantity > 0),
  CONSTRAINT resource_consumption_document_hash_unique UNIQUE (organization_id, document_hash)
);

-- -----------------------------------------------------------------------------
-- SOCIAL — CSR, DEI, CHALLENGES
-- -----------------------------------------------------------------------------
CREATE TABLE csr_activities (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  department_id       UUID NOT NULL REFERENCES departments(id),
  submitted_by_id     UUID NOT NULL REFERENCES users(id),
  title               VARCHAR(200) NOT NULL,
  description         TEXT NOT NULL,
  activity_date       TIMESTAMPTZ NOT NULL,
  hours_contributed   NUMERIC(10, 2) NOT NULL,
  beneficiaries_count INTEGER,
  evidence_file_key   VARCHAR(500),
  status              approval_status NOT NULL DEFAULT 'draft',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT csr_activities_hours_positive CHECK (hours_contributed > 0)
);

CREATE TABLE dei_snapshots (
  id                              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id                 UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  department_id                   UUID REFERENCES departments(id),
  recorded_by_id                  UUID NOT NULL REFERENCES users(id),
  period_start                    TIMESTAMPTZ NOT NULL,
  period_end                      TIMESTAMPTZ NOT NULL,
  female_percentage               NUMERIC(5, 2) NOT NULL,
  underrepresented_percentage     NUMERIC(5, 2) NOT NULL,
  leadership_diversity_percentage NUMERIC(5, 2) NOT NULL,
  total_headcount                 INTEGER NOT NULL,
  notes                           TEXT,
  status                          approval_status NOT NULL DEFAULT 'submitted',
  created_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT dei_female_pct_range CHECK (female_percentage >= 0 AND female_percentage <= 100),
  CONSTRAINT dei_headcount_positive CHECK (total_headcount > 0)
);

CREATE TABLE challenges (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  department_id   UUID REFERENCES departments(id),
  created_by_id   UUID NOT NULL REFERENCES users(id),
  title           VARCHAR(200) NOT NULL,
  description     TEXT NOT NULL,
  start_date      TIMESTAMPTZ NOT NULL,
  end_date        TIMESTAMPTZ NOT NULL,
  xp_reward       INTEGER NOT NULL,
  points_reward   INTEGER NOT NULL,
  status          challenge_status NOT NULL DEFAULT 'draft',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT challenges_rewards_positive CHECK (xp_reward > 0 AND points_reward > 0),
  CONSTRAINT challenges_date_order CHECK (end_date > start_date)
);

CREATE TABLE challenge_participations (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  challenge_id           UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id                UUID NOT NULL REFERENCES users(id),
  evidence_description   TEXT NOT NULL,
  evidence_file_key      VARCHAR(500),
  snapshot_xp_reward     INTEGER NOT NULL,
  snapshot_points_reward INTEGER NOT NULL,
  status                 approval_status NOT NULL DEFAULT 'draft',
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT challenge_participations_unique UNIQUE (challenge_id, user_id)
);

-- -----------------------------------------------------------------------------
-- GOVERNANCE — APPROVALS, COMPLIANCE, POLICIES, FRAMEWORKS
-- -----------------------------------------------------------------------------
CREATE TABLE approvals (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_type            approval_entity_type NOT NULL,
  entity_id              UUID NOT NULL,
  status                 approval_status NOT NULL DEFAULT 'submitted',
  submitted_by_id        UUID NOT NULL REFERENCES users(id),
  submitted_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  decided_by_id          UUID REFERENCES users(id),
  decided_at             TIMESTAMPTZ,
  approver_role          role,
  decision_comment       TEXT,
  side_effects_applied_at TIMESTAMPTZ,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT approvals_entity_unique UNIQUE (entity_type, entity_id)
);

CREATE TABLE approval_stages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  approval_id     UUID NOT NULL REFERENCES approvals(id) ON DELETE CASCADE,
  stage_order     INTEGER NOT NULL,
  required_role   role NOT NULL,
  status          approval_stage_status NOT NULL DEFAULT 'pending',
  decided_by_id   UUID REFERENCES users(id),
  decided_at      TIMESTAMPTZ,
  decision_comment TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT approval_stages_unique UNIQUE (approval_id, stage_order)
);

CREATE TABLE compliance_issues (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  department_id   UUID REFERENCES departments(id),
  title           VARCHAR(200) NOT NULL,
  description     TEXT NOT NULL,
  severity        VARCHAR(20) NOT NULL,
  status          compliance_issue_status NOT NULL DEFAULT 'open',
  due_date        TIMESTAMPTZ,
  created_by_id   UUID NOT NULL REFERENCES users(id),
  assigned_to_id  UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE compliance_issue_status_history (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id      UUID NOT NULL REFERENCES compliance_issues(id) ON DELETE CASCADE,
  from_status   compliance_issue_status,
  to_status     compliance_issue_status NOT NULL,
  changed_by_id UUID NOT NULL REFERENCES users(id),
  comment       TEXT,
  changed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE policies (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id         UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title                   VARCHAR(200) NOT NULL,
  content                 TEXT NOT NULL,
  version                 VARCHAR(20) NOT NULL,
  effective_from          TIMESTAMPTZ NOT NULL,
  requires_acknowledgement BOOLEAN NOT NULL DEFAULT TRUE,
  created_by_id           UUID NOT NULL REFERENCES users(id),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT policies_org_title_version_unique UNIQUE (organization_id, title, version)
);

CREATE TABLE policy_acknowledgements (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id         UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  policy_id               UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
  user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  acknowledged_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  snapshot_policy_version VARCHAR(20) NOT NULL,
  CONSTRAINT policy_ack_unique UNIQUE (policy_id, user_id)
);

CREATE TABLE framework_mappings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  framework       compliance_framework NOT NULL,
  metric_code     VARCHAR(100) NOT NULL,
  metric_title    VARCHAR(300) NOT NULL,
  domain          VARCHAR(50) NOT NULL,
  description     TEXT NOT NULL,
  unit            VARCHAR(50) NOT NULL,
  is_mandatory    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT framework_mappings_unique UNIQUE (organization_id, framework, metric_code)
);

CREATE TABLE framework_metric_submissions (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  framework_mapping_id   UUID NOT NULL REFERENCES framework_mappings(id) ON DELETE CASCADE,
  submitted_by_id        UUID NOT NULL REFERENCES users(id),
  reporting_period_start TIMESTAMPTZ NOT NULL,
  reporting_period_end   TIMESTAMPTZ NOT NULL,
  reported_value         NUMERIC(10, 2) NOT NULL,
  snapshot_metric_title  VARCHAR(300) NOT NULL,
  snapshot_framework     compliance_framework NOT NULL,
  evidence_document_hash VARCHAR(128),
  status                 approval_status NOT NULL DEFAULT 'submitted',
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT framework_submissions_period_unique UNIQUE (
    framework_mapping_id, reporting_period_start, reporting_period_end
  )
);

-- -----------------------------------------------------------------------------
-- GAMIFICATION — XP, POINTS, BADGES, REWARDS
-- -----------------------------------------------------------------------------
CREATE TABLE xp_ledger (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entry_type      ledger_entry_type NOT NULL,
  amount          INTEGER NOT NULL,
  source_type     VARCHAR(100) NOT NULL,
  source_id       UUID NOT NULL,
  description     TEXT,
  recorded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT xp_ledger_amount_positive CHECK (amount > 0),
  CONSTRAINT xp_ledger_idempotent UNIQUE (source_type, source_id, user_id, entry_type)
);

CREATE TABLE points_ledger (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entry_type      ledger_entry_type NOT NULL,
  amount          INTEGER NOT NULL,
  source_type     VARCHAR(100) NOT NULL,
  source_id       UUID NOT NULL,
  description     TEXT,
  recorded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT points_ledger_amount_positive CHECK (amount > 0),
  CONSTRAINT points_ledger_idempotent UNIQUE (source_type, source_id, user_id, entry_type)
);

CREATE TABLE badges (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            VARCHAR(150) NOT NULL,
  description     TEXT NOT NULL,
  icon_key        VARCHAR(100) NOT NULL,
  criteria_json   JSONB NOT NULL,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT badges_org_name_unique UNIQUE (organization_id, name)
);

CREATE TABLE user_badges (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id                UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id               UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  triggering_source_type VARCHAR(100) NOT NULL,
  triggering_source_id   UUID NOT NULL,
  CONSTRAINT user_badges_unique UNIQUE (user_id, badge_id),
  CONSTRAINT user_badges_idempotent UNIQUE (user_id, badge_id, triggering_source_type, triggering_source_id)
);

CREATE TABLE rewards (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            VARCHAR(200) NOT NULL,
  description     TEXT NOT NULL,
  points_cost     INTEGER NOT NULL,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT rewards_points_cost_positive CHECK (points_cost > 0),
  CONSTRAINT rewards_org_name_unique UNIQUE (organization_id, name)
);

CREATE TABLE reward_inventory (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  reward_id       UUID NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
  stock_remaining INTEGER NOT NULL,
  version         INTEGER NOT NULL DEFAULT 0,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT reward_inventory_stock_nonnegative CHECK (stock_remaining >= 0),
  CONSTRAINT reward_inventory_reward_unique UNIQUE (reward_id)
);

CREATE TABLE reward_redemptions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  reward_id            UUID NOT NULL REFERENCES rewards(id),
  user_id              UUID NOT NULL REFERENCES users(id),
  snapshot_points_cost INTEGER NOT NULL,
  status               approval_status NOT NULL DEFAULT 'submitted',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE participation_streaks (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id              UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  current_streak_weeks INTEGER NOT NULL DEFAULT 0,
  longest_streak_weeks INTEGER NOT NULL DEFAULT 0,
  last_activity_week   VARCHAR(10) NOT NULL,
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT participation_streaks_nonnegative CHECK (
    current_streak_weeks >= 0 AND longest_streak_weeks >= 0
  ),
  CONSTRAINT participation_streaks_user_org_unique UNIQUE (organization_id, user_id)
);

-- -----------------------------------------------------------------------------
-- ESG SCORING, GOALS, REPORTING
-- -----------------------------------------------------------------------------
CREATE TABLE esg_weightages (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  environmental_weight NUMERIC(5, 2) NOT NULL,
  social_weight        NUMERIC(5, 2) NOT NULL,
  governance_weight    NUMERIC(5, 2) NOT NULL,
  effective_from       TIMESTAMPTZ NOT NULL,
  effective_to         TIMESTAMPTZ,
  created_by_id        UUID NOT NULL REFERENCES users(id),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT esg_weightages_sum_100 CHECK (
    environmental_weight + social_weight + governance_weight = 100
  )
);

CREATE TABLE esg_score_snapshots (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  period_start        TIMESTAMPTZ NOT NULL,
  period_end          TIMESTAMPTZ NOT NULL,
  environmental_score NUMERIC(10, 2) NOT NULL,
  social_score        NUMERIC(10, 2) NOT NULL,
  governance_score    NUMERIC(10, 2) NOT NULL,
  composite_score     NUMERIC(10, 2) NOT NULL,
  weightage_snapshot  JSONB NOT NULL,
  calculated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT esg_score_snapshots_period_unique UNIQUE (organization_id, period_start, period_end)
);

CREATE TABLE goals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  department_id   UUID REFERENCES departments(id),
  title           VARCHAR(200) NOT NULL,
  domain          esg_domain NOT NULL,
  target_value    NUMERIC(10, 2) NOT NULL,
  current_value   NUMERIC(10, 2) NOT NULL DEFAULT 0,
  unit            VARCHAR(50) NOT NULL,
  start_date      TIMESTAMPTZ NOT NULL,
  end_date        TIMESTAMPTZ NOT NULL,
  created_by_id   UUID NOT NULL REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT goals_target_positive CHECK (target_value > 0),
  CONSTRAINT goals_current_nonnegative CHECK (current_value >= 0)
);

CREATE TABLE reports (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  report_type       VARCHAR(100) NOT NULL,
  period_start      TIMESTAMPTZ NOT NULL,
  period_end        TIMESTAMPTZ NOT NULL,
  score_snapshot_id UUID REFERENCES esg_score_snapshots(id),
  file_key          VARCHAR(500),
  generated_by_id   UUID REFERENCES users(id),
  generated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE report_pipeline_jobs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  report_type      VARCHAR(100) NOT NULL,
  framework        compliance_framework,
  period_start     TIMESTAMPTZ NOT NULL,
  period_end       TIMESTAMPTZ NOT NULL,
  status           report_pipeline_status NOT NULL DEFAULT 'queued',
  current_step     VARCHAR(100) NOT NULL DEFAULT 'queued',
  payload_snapshot JSONB,
  error_message    TEXT,
  started_at       TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ,
  created_by_id    UUID REFERENCES users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT report_pipeline_jobs_idempotent UNIQUE (
    organization_id, report_type, period_start, period_end
  )
);

CREATE TABLE report_variance_snapshots (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  metric_key       VARCHAR(100) NOT NULL,
  metric_label     VARCHAR(200) NOT NULL,
  current_value    NUMERIC(10, 2) NOT NULL,
  previous_value   NUMERIC(10, 2) NOT NULL,
  variance_percent NUMERIC(10, 2) NOT NULL,
  period_start     TIMESTAMPTZ NOT NULL,
  period_end       TIMESTAMPTZ NOT NULL,
  calculated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT report_variance_snapshots_unique UNIQUE (
    organization_id, metric_key, period_start, period_end
  )
);

-- -----------------------------------------------------------------------------
-- NOTIFICATIONS & AUDIT
-- -----------------------------------------------------------------------------
CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type            notification_type NOT NULL,
  title           VARCHAR(200) NOT NULL,
  body            TEXT NOT NULL,
  entity_type     VARCHAR(100),
  entity_id       UUID,
  is_read         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT notifications_idempotent UNIQUE (type, entity_id, user_id)
);

CREATE TABLE audit_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  actor_user_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  action          VARCHAR(150) NOT NULL,
  entity_type     VARCHAR(100) NOT NULL,
  entity_id       UUID,
  metadata        JSONB,
  ip_address      VARCHAR(45),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- B-TREE INDEXES — Standard lookups
-- =============================================================================
CREATE INDEX refresh_tokens_user_id_idx ON refresh_tokens USING btree (user_id);
CREATE INDEX password_reset_tokens_user_id_idx ON password_reset_tokens USING btree (user_id);
CREATE INDEX departments_org_id_idx ON departments USING btree (organization_id);
CREATE INDEX user_roles_user_id_idx ON user_roles USING btree (user_id);
CREATE INDEX user_roles_org_id_idx ON user_roles USING btree (organization_id);

-- =============================================================================
-- COMPOSITE B-TREE INDEXES — High-performance analytics queries
-- =============================================================================

-- Carbon: org + status + date range scans (dashboard trend charts)
CREATE INDEX carbon_tx_org_status_date_idx
  ON carbon_transactions USING btree (organization_id, status, activity_date DESC);

CREATE INDEX carbon_tx_org_scope_date_idx
  ON carbon_transactions USING btree (organization_id, scope, activity_date DESC);

CREATE INDEX carbon_tx_dept_status_idx
  ON carbon_transactions USING btree (department_id, status);

-- Partial index: approved emissions only (reporting aggregates)
CREATE INDEX carbon_tx_approved_analytics_idx
  ON carbon_transactions USING btree (organization_id, scope, activity_date DESC)
  WHERE status = 'approved';

CREATE INDEX carbon_ledger_org_recorded_idx
  ON carbon_ledger USING btree (organization_id, recorded_at DESC);

CREATE INDEX carbon_scope_breakdown_org_period_idx
  ON carbon_scope_breakdown USING btree (organization_id, period_start DESC, period_end DESC);

-- CSR & social analytics
CREATE INDEX csr_org_status_date_idx
  ON csr_activities USING btree (organization_id, status, activity_date DESC);

CREATE INDEX csr_submitter_status_idx
  ON csr_activities USING btree (submitted_by_id, status);

CREATE INDEX dei_org_period_idx
  ON dei_snapshots USING btree (organization_id, period_start DESC);

-- Approval workflow inbox
CREATE INDEX approvals_org_status_submitted_idx
  ON approvals USING btree (organization_id, status, submitted_at DESC);

CREATE INDEX approval_stages_approval_status_idx
  ON approval_stages USING btree (approval_id, status);

-- Gamification leaderboards
CREATE INDEX xp_ledger_org_user_recorded_idx
  ON xp_ledger USING btree (organization_id, user_id, recorded_at DESC);

CREATE INDEX points_ledger_org_user_recorded_idx
  ON points_ledger USING btree (organization_id, user_id, recorded_at DESC);

-- ESG scoring & reporting
CREATE INDEX esg_weightages_org_effective_idx
  ON esg_weightages USING btree (organization_id, effective_from DESC);

CREATE INDEX esg_score_snapshots_org_calculated_idx
  ON esg_score_snapshots USING btree (organization_id, calculated_at DESC);

CREATE INDEX goals_org_domain_end_date_idx
  ON goals USING btree (organization_id, domain, end_date DESC);

CREATE INDEX reports_org_generated_idx
  ON reports USING btree (organization_id, generated_at DESC);

CREATE INDEX report_pipeline_org_status_created_idx
  ON report_pipeline_jobs USING btree (organization_id, status, created_at DESC);

-- Governance & compliance
CREATE INDEX compliance_issues_org_status_due_idx
  ON compliance_issues USING btree (organization_id, status, due_date);

CREATE INDEX framework_submissions_org_status_idx
  ON framework_metric_submissions USING btree (organization_id, status);

CREATE INDEX emission_factors_org_scope_category_idx
  ON emission_factors USING btree (organization_id, scope, category);

-- Notifications & audit trail
CREATE INDEX notifications_user_read_created_idx
  ON notifications USING btree (user_id, is_read, created_at DESC);

CREATE INDEX audit_logs_org_created_idx
  ON audit_logs USING btree (organization_id, created_at DESC);

CREATE INDEX resource_consumption_org_type_date_idx
  ON resource_consumption_ledger USING btree (organization_id, resource_type, consumption_date DESC);

COMMIT;
