-- EcoSphere PostgreSQL performance indexes (supplement to Drizzle schema indexes).
-- Run after migrations for query-plan optimization on hot paths.

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_carbon_transactions_org_status_created
  ON carbon_transactions (organization_id, status, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_csr_activities_org_status_created
  ON csr_activities (organization_id, status, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_xp_ledger_org_user_recorded
  ON xp_ledger (organization_id, user_id, recorded_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_points_ledger_org_user_recorded
  ON points_ledger (organization_id, user_id, recorded_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_approvals_org_status_submitted
  ON approvals (organization_id, status, submitted_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_unread
  ON notifications (user_id, is_read, created_at DESC);

ANALYZE;
