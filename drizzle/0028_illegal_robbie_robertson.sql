CREATE TYPE "public"."club_role" AS ENUM('leader', 'member');--> statement-breakpoint
CREATE TABLE "club" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"joinCode" text,
	"createdAt" timestamp DEFAULT now(),
	CONSTRAINT "club_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "club_membership" (
	"id" serial PRIMARY KEY NOT NULL,
	"clubId" integer NOT NULL,
	"userId" integer NOT NULL,
	"role" "club_role" NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	CONSTRAINT "club_membership_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
ALTER TABLE "ship" ADD COLUMN "clubId" integer;--> statement-breakpoint
ALTER TABLE "club_membership" ADD CONSTRAINT "club_membership_clubId_club_id_fk" FOREIGN KEY ("clubId") REFERENCES "public"."club"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_membership" ADD CONSTRAINT "club_membership_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ship" ADD CONSTRAINT "ship_clubId_club_id_fk" FOREIGN KEY ("clubId") REFERENCES "public"."club"("id") ON DELETE no action ON UPDATE no action;