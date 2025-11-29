CREATE TYPE "public"."hackatime_trust" AS ENUM('green', 'blue', 'yellow', 'red');--> statement-breakpoint
CREATE TYPE "public"."project_audit_log_type" AS ENUM('create', 'update', 'delete');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('building', 'submitted', 't1_approved', 't2_approved', 'finalized', 'rejected', 'rejected_locked');--> statement-breakpoint
CREATE TYPE "public"."t1_review_action" AS ENUM('approve', 'reject', 'reject_lock');--> statement-breakpoint
CREATE TYPE "public"."trust" AS ENUM('green', 'blue', 'yellow', 'red');--> statement-breakpoint
CREATE TABLE "devlog" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer,
	"projectId" integer NOT NULL,
	"description" text NOT NULL,
	"timeSpent" integer NOT NULL,
	"image" text NOT NULL,
	"model" text NOT NULL,
	"deleted" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"name" text,
	"description" text,
	"url" text,
	"status" "status" DEFAULT 'building' NOT NULL,
	"deleted" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_audit_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"actionUserId" integer NOT NULL,
	"projectId" integer NOT NULL,
	"type" "project_audit_log_type" NOT NULL,
	"name" text,
	"description" text,
	"url" text,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" serial PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"userId" integer NOT NULL,
	"expiresAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "t1_review" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"projectId" integer NOT NULL,
	"feedback" text,
	"notes" text,
	"action" "t1_review_action" NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" serial PRIMARY KEY NOT NULL,
	"idvId" text NOT NULL,
	"slackId" text NOT NULL,
	"profilePicture" text NOT NULL,
	"name" text NOT NULL,
	"hackatimeTrust" "hackatime_trust" NOT NULL,
	"trust" "trust" DEFAULT 'blue' NOT NULL,
	"clay" real DEFAULT 0 NOT NULL,
	"brick" real DEFAULT 0 NOT NULL,
	"shopScore" real DEFAULT 0 NOT NULL,
	"hasBasePrinter" boolean DEFAULT false NOT NULL,
	"hasProjectAuditLogs" boolean DEFAULT false NOT NULL,
	"hasT1Review" boolean DEFAULT false NOT NULL,
	"hasT2Review" boolean DEFAULT false NOT NULL,
	"hasAdmin" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"lastLoginAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_idvId_unique" UNIQUE("idvId"),
	CONSTRAINT "user_slackId_unique" UNIQUE("slackId")
);
--> statement-breakpoint
ALTER TABLE "devlog" ADD CONSTRAINT "devlog_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "devlog" ADD CONSTRAINT "devlog_projectId_project_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."project"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_audit_log" ADD CONSTRAINT "project_audit_log_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_audit_log" ADD CONSTRAINT "project_audit_log_actionUserId_user_id_fk" FOREIGN KEY ("actionUserId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_audit_log" ADD CONSTRAINT "project_audit_log_projectId_project_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."project"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "t1_review" ADD CONSTRAINT "t1_review_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "t1_review" ADD CONSTRAINT "t1_review_projectId_project_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."project"("id") ON DELETE no action ON UPDATE no action;