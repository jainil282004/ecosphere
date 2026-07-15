CREATE TABLE "audit_exports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"requested_by_id" uuid NOT NULL,
	"status" varchar(50) NOT NULL,
	"file_url" text,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "login_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"organization_id" uuid,
	"status" varchar(50) NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text,
	"failure_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "retention_policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"module" varchar(100) NOT NULL,
	"retention_days" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "security_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid,
	"event_type" varchar(100) NOT NULL,
	"severity" varchar(20) NOT NULL,
	"ip_address" varchar(45),
	"details" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"session_id" varchar(100) NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"ended_at" timestamp,
	"end_reason" varchar(50),
	"ip_address" varchar(45),
	"device_info" jsonb
);
--> statement-breakpoint
DROP INDEX "doc_audit_doc_idx";--> statement-breakpoint
DROP INDEX "doc_comments_doc_idx";--> statement-breakpoint
DROP INDEX "doc_favorites_unique_idx";--> statement-breakpoint
DROP INDEX "doc_favorites_user_idx";--> statement-breakpoint
DROP INDEX "doc_folders_org_idx";--> statement-breakpoint
DROP INDEX "doc_folders_parent_idx";--> statement-breakpoint
DROP INDEX "doc_shares_doc_idx";--> statement-breakpoint
DROP INDEX "doc_tags_doc_idx";--> statement-breakpoint
DROP INDEX "doc_tags_tag_idx";--> statement-breakpoint
DROP INDEX "doc_tags_unique_idx";--> statement-breakpoint
DROP INDEX "doc_versions_unique_idx";--> statement-breakpoint
DROP INDEX "doc_versions_doc_idx";--> statement-breakpoint
DROP INDEX "docs_org_idx";--> statement-breakpoint
DROP INDEX "docs_folder_idx";--> statement-breakpoint
DROP INDEX "docs_status_idx";--> statement-breakpoint
DROP INDEX "docs_category_idx";--> statement-breakpoint
DROP INDEX "docs_dept_idx";--> statement-breakpoint
ALTER TABLE "audit_exports" ADD CONSTRAINT "audit_exports_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_exports" ADD CONSTRAINT "audit_exports_requested_by_id_users_id_fk" FOREIGN KEY ("requested_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "login_history" ADD CONSTRAINT "login_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "login_history" ADD CONSTRAINT "login_history_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retention_policies" ADD CONSTRAINT "retention_policies_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "security_events" ADD CONSTRAINT "security_events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "security_events" ADD CONSTRAINT "security_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_history" ADD CONSTRAINT "session_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;