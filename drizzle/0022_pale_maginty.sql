CREATE TABLE "impersonate_audit_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"adminUserId" integer NOT NULL,
	"targetUserId" integer NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "impersonate_audit_log" ADD CONSTRAINT "impersonate_audit_log_adminUserId_user_id_fk" FOREIGN KEY ("adminUserId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "impersonate_audit_log" ADD CONSTRAINT "impersonate_audit_log_targetUserId_user_id_fk" FOREIGN KEY ("targetUserId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;