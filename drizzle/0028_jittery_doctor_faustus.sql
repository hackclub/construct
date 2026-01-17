CREATE TYPE "public"."printer_order_status" AS ENUM('awaiting_approval', 'fulfilled', 'denied', 'refunded');--> statement-breakpoint
CREATE TABLE "printer" (
	"id" serial PRIMARY KEY NOT NULL,
	"editedBy" json,
	"createdBy" integer,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"image" text NOT NULL,
	"minRequiredShopScore" integer DEFAULT 0 NOT NULL,
	"clayPrice" integer NOT NULL,
	"minShopScore" integer NOT NULL,
	"maxShopScore" integer NOT NULL,
	"maxPrice" integer NOT NULL,
	"minPrice" integer NOT NULL,
	"requiresId" integer,
	"isPublic" boolean DEFAULT false NOT NULL,
	"deleted" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "printer_order" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"printerId" integer NOT NULL,
	"addressId" text,
	"bricksPaid" integer NOT NULL,
	"status" "printer_order_status" DEFAULT 'awaiting_approval' NOT NULL,
	"userNotes" text NOT NULL,
	"notes" text,
	"deleted" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "preferredBasePrinterId" integer;--> statement-breakpoint
ALTER TABLE "printer" ADD CONSTRAINT "printer_createdBy_user_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "printer" ADD CONSTRAINT "printer_requiresId_printer_id_fk" FOREIGN KEY ("requiresId") REFERENCES "public"."printer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "printer_order" ADD CONSTRAINT "printer_order_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "printer_order" ADD CONSTRAINT "printer_order_printerId_printer_id_fk" FOREIGN KEY ("printerId") REFERENCES "public"."printer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_preferredBasePrinterId_printer_id_fk" FOREIGN KEY ("preferredBasePrinterId") REFERENCES "public"."printer"("id") ON DELETE no action ON UPDATE no action;