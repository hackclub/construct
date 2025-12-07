ALTER TYPE "public"."status" ADD VALUE 'print_queue' BEFORE 't2_approved';--> statement-breakpoint
ALTER TYPE "public"."status" ADD VALUE 'printing' BEFORE 't2_approved';--> statement-breakpoint
ALTER TYPE "public"."status" ADD VALUE 'printed' BEFORE 't2_approved';--> statement-breakpoint
ALTER TYPE "public"."t1_review_action" ADD VALUE 'approve_no_print' BEFORE 'reject';--> statement-breakpoint
DROP TABLE "project_audit_log" CASCADE;--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "hasProjectAuditLogs";