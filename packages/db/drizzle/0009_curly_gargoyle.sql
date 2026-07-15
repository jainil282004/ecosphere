ALTER TABLE "announcements" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "notification_history" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "notification_preferences" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "reminder_schedules" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "announcements" CASCADE;--> statement-breakpoint
DROP TABLE "notification_history" CASCADE;--> statement-breakpoint
DROP TABLE "notification_preferences" CASCADE;--> statement-breakpoint
DROP TABLE "reminder_schedules" CASCADE;--> statement-breakpoint
ALTER TABLE "audit_exports" ALTER COLUMN "expires_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "audit_exports" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "audit_logs" ALTER COLUMN "action" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "login_history" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "retention_policies" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "retention_policies" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "security_events" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "session_history" ALTER COLUMN "started_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "session_history" ALTER COLUMN "ended_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "module" varchar(100);--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "browser" varchar(100);--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "os" varchar(100);--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "device" varchar(100);--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "location" varchar(255);--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "session_id" varchar(100);--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "request_id" varchar(100);--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "old_value" jsonb;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "new_value" jsonb;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "success" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "severity" varchar(20) DEFAULT 'info' NOT NULL;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "execution_time" integer;--> statement-breakpoint
ALTER TABLE "workflow_templates" ADD COLUMN "title" varchar(200) NOT NULL;--> statement-breakpoint
ALTER TABLE "workflow_templates" DROP COLUMN "name";--> statement-breakpoint
DROP TYPE "public"."notification_priority";--> statement-breakpoint
DROP TYPE "public"."notification_status";