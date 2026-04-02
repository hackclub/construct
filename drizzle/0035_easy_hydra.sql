CREATE TYPE "public"."double_dipping" AS ENUM('none', 'enclosure');--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "doubleDippingWith" "double_dipping" DEFAULT 'none' NOT NULL;