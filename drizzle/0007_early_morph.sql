CREATE TYPE "public"."editor_file_type" AS ENUM('url', 'upload');--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "editorFileType" "editor_file_type";--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "editorUrl" text;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "uploadedFileUrl" text;