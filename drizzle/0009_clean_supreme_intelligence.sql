CREATE TABLE "ship" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"projectId" integer NOT NULL,
	"url" text NOT NULL,
	"editorFileType" "editor_file_type" NOT NULL,
	"editorUrl" text,
	"uploadedFileUrl" text,
	"modelFile" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ship" ADD CONSTRAINT "ship_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ship" ADD CONSTRAINT "ship_projectId_project_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."project"("id") ON DELETE no action ON UPDATE no action;