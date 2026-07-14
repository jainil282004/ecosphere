CREATE TYPE "public"."approval_stage_status" AS ENUM('pending', 'approved', 'rejected', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."carbon_scope" AS ENUM('scope_1', 'scope_2', 'scope_3');--> statement-breakpoint
CREATE TYPE "public"."compliance_framework" AS ENUM('brsr', 'gri', 'csrd');--> statement-breakpoint
CREATE TYPE "public"."report_pipeline_status" AS ENUM('queued', 'extracting', 'transforming', 'validating', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."resource_type" AS ENUM('energy', 'water');--> statement-breakpoint
ALTER TYPE "public"."approval_entity_type" ADD VALUE 'resource_consumption';--> statement-breakpoint
ALTER TYPE "public"."approval_entity_type" ADD VALUE 'framework_metric';--> statement-breakpoint
ALTER TYPE "public"."approval_entity_type" ADD VALUE 'dei_snapshot';--> statement-breakpoint
CREATE TABLE "approval_stages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"approval_id" uuid NOT NULL,
	"stage_order" integer NOT NULL,
	"required_role" "role" NOT NULL,
	"status" "approval_stage_status" DEFAULT 'pending' NOT NULL,
	"decided_by_id" uuid,
	"decided_at" timestamp with time zone,
	"decision_comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "carbon_scope_breakdown" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"scope_1_kg" numeric(18, 4) DEFAULT '0' NOT NULL,
	"scope_2_kg" numeric(18, 4) DEFAULT '0' NOT NULL,
	"scope_3_kg" numeric(18, 4) DEFAULT '0' NOT NULL,
	"calculated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dei_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"department_id" uuid,
	"recorded_by_id" uuid NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"female_percentage" numeric(5, 2) NOT NULL,
	"underrepresented_percentage" numeric(5, 2) NOT NULL,
	"leadership_diversity_percentage" numeric(5, 2) NOT NULL,
	"total_headcount" integer NOT NULL,
	"notes" text,
	"status" "approval_status" DEFAULT 'submitted' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "dei_female_pct_range" CHECK ("dei_snapshots"."female_percentage" >= 0 AND "dei_snapshots"."female_percentage" <= 100)
);
--> statement-breakpoint
CREATE TABLE "framework_mappings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"framework" "compliance_framework" NOT NULL,
	"metric_code" varchar(100) NOT NULL,
	"metric_title" varchar(300) NOT NULL,
	"domain" varchar(50) NOT NULL,
	"description" text NOT NULL,
	"unit" varchar(50) NOT NULL,
	"is_mandatory" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "framework_metric_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"framework_mapping_id" uuid NOT NULL,
	"submitted_by_id" uuid NOT NULL,
	"reporting_period_start" timestamp with time zone NOT NULL,
	"reporting_period_end" timestamp with time zone NOT NULL,
	"reported_value" numeric(18, 4) NOT NULL,
	"snapshot_metric_title" varchar(300) NOT NULL,
	"snapshot_framework" "compliance_framework" NOT NULL,
	"evidence_document_hash" varchar(128),
	"status" "approval_status" DEFAULT 'submitted' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "participation_streaks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"current_streak_weeks" integer DEFAULT 0 NOT NULL,
	"longest_streak_weeks" integer DEFAULT 0 NOT NULL,
	"last_activity_week" varchar(10) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "report_pipeline_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"report_type" varchar(100) NOT NULL,
	"framework" "compliance_framework",
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"status" "report_pipeline_status" DEFAULT 'queued' NOT NULL,
	"current_step" varchar(100) DEFAULT 'queued' NOT NULL,
	"payload_snapshot" jsonb,
	"error_message" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "report_variance_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"metric_key" varchar(100) NOT NULL,
	"metric_label" varchar(200) NOT NULL,
	"current_value" numeric(18, 4) NOT NULL,
	"previous_value" numeric(18, 4) NOT NULL,
	"variance_percent" numeric(10, 4) NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"calculated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resource_consumption_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"department_id" uuid NOT NULL,
	"submitted_by_id" uuid NOT NULL,
	"resource_type" "resource_type" NOT NULL,
	"quantity" numeric(18, 4) NOT NULL,
	"unit" varchar(50) NOT NULL,
	"consumption_date" timestamp with time zone NOT NULL,
	"document_hash" varchar(128) NOT NULL,
	"document_file_key" varchar(500),
	"description" text,
	"status" "approval_status" DEFAULT 'submitted' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "resource_consumption_quantity_positive" CHECK ("resource_consumption_ledger"."quantity" > 0)
);
--> statement-breakpoint
ALTER TABLE "carbon_transactions" ADD COLUMN "scope" "carbon_scope" NOT NULL;--> statement-breakpoint
ALTER TABLE "emission_factors" ADD COLUMN "scope" "carbon_scope" DEFAULT 'scope_2' NOT NULL;--> statement-breakpoint
ALTER TABLE "approval_stages" ADD CONSTRAINT "approval_stages_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_stages" ADD CONSTRAINT "approval_stages_decided_by_id_users_id_fk" FOREIGN KEY ("decided_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carbon_scope_breakdown" ADD CONSTRAINT "carbon_scope_breakdown_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dei_snapshots" ADD CONSTRAINT "dei_snapshots_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dei_snapshots" ADD CONSTRAINT "dei_snapshots_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dei_snapshots" ADD CONSTRAINT "dei_snapshots_recorded_by_id_users_id_fk" FOREIGN KEY ("recorded_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "framework_mappings" ADD CONSTRAINT "framework_mappings_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "framework_metric_submissions" ADD CONSTRAINT "framework_metric_submissions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "framework_metric_submissions" ADD CONSTRAINT "framework_metric_submissions_framework_mapping_id_framework_mappings_id_fk" FOREIGN KEY ("framework_mapping_id") REFERENCES "public"."framework_mappings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "framework_metric_submissions" ADD CONSTRAINT "framework_metric_submissions_submitted_by_id_users_id_fk" FOREIGN KEY ("submitted_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "participation_streaks" ADD CONSTRAINT "participation_streaks_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "participation_streaks" ADD CONSTRAINT "participation_streaks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_pipeline_jobs" ADD CONSTRAINT "report_pipeline_jobs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_pipeline_jobs" ADD CONSTRAINT "report_pipeline_jobs_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_variance_snapshots" ADD CONSTRAINT "report_variance_snapshots_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_consumption_ledger" ADD CONSTRAINT "resource_consumption_ledger_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_consumption_ledger" ADD CONSTRAINT "resource_consumption_ledger_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_consumption_ledger" ADD CONSTRAINT "resource_consumption_ledger_submitted_by_id_users_id_fk" FOREIGN KEY ("submitted_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "approval_stages_unique_idx" ON "approval_stages" USING btree ("approval_id","stage_order");--> statement-breakpoint
CREATE INDEX "approval_stages_approval_idx" ON "approval_stages" USING btree ("approval_id");--> statement-breakpoint
CREATE UNIQUE INDEX "carbon_scope_breakdown_period_idx" ON "carbon_scope_breakdown" USING btree ("organization_id","period_start","period_end");--> statement-breakpoint
CREATE INDEX "dei_snapshots_org_period_idx" ON "dei_snapshots" USING btree ("organization_id","period_start");--> statement-breakpoint
CREATE UNIQUE INDEX "framework_mappings_unique_idx" ON "framework_mappings" USING btree ("organization_id","framework","metric_code");--> statement-breakpoint
CREATE INDEX "framework_submissions_org_status_idx" ON "framework_metric_submissions" USING btree ("organization_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "framework_submissions_period_idx" ON "framework_metric_submissions" USING btree ("framework_mapping_id","reporting_period_start","reporting_period_end");--> statement-breakpoint
CREATE UNIQUE INDEX "participation_streaks_user_org_idx" ON "participation_streaks" USING btree ("organization_id","user_id");--> statement-breakpoint
CREATE INDEX "report_pipeline_jobs_org_status_idx" ON "report_pipeline_jobs" USING btree ("organization_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "report_pipeline_jobs_idempotent_idx" ON "report_pipeline_jobs" USING btree ("organization_id","report_type","period_start","period_end");--> statement-breakpoint
CREATE UNIQUE INDEX "report_variance_snapshots_unique_idx" ON "report_variance_snapshots" USING btree ("organization_id","metric_key","period_start","period_end");--> statement-breakpoint
CREATE INDEX "resource_consumption_org_type_idx" ON "resource_consumption_ledger" USING btree ("organization_id","resource_type");--> statement-breakpoint
CREATE UNIQUE INDEX "resource_consumption_document_hash_idx" ON "resource_consumption_ledger" USING btree ("organization_id","document_hash");