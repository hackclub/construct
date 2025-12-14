CREATE TABLE "ai_devlog_review" (
	"id" serial PRIMARY KEY NOT NULL,
	"devlogId" integer NOT NULL,
	"projectId" integer NOT NULL,
	"approved" boolean NOT NULL,
	"rationale" text NOT NULL,
	"prompt" text NOT NULL,
	"model" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ai_devlog_review_devlogId_unique" UNIQUE("devlogId")
);
--> statement-breakpoint
CREATE TABLE "ai_project_review" (
	"id" serial PRIMARY KEY NOT NULL,
	"projectId" integer NOT NULL,
	"overallApproved" boolean NOT NULL,
	"summary" text NOT NULL,
	"prompt" text NOT NULL,
	"model" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ai_project_review_projectId_unique" UNIQUE("projectId")
);
--> statement-breakpoint
ALTER TABLE "ai_devlog_review" ADD CONSTRAINT "ai_devlog_review_devlogId_devlog_id_fk" FOREIGN KEY ("devlogId") REFERENCES "public"."devlog"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_devlog_review" ADD CONSTRAINT "ai_devlog_review_projectId_project_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."project"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_project_review" ADD CONSTRAINT "ai_project_review_projectId_project_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."project"("id") ON DELETE no action ON UPDATE no action;