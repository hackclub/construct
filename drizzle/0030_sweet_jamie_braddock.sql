CREATE TABLE "market_printer_order" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"printer" json NOT NULL,
	"clayPaid" integer,
	"bricksPaid" integer,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "printer" json DEFAULT '{"path":[]}'::json NOT NULL;--> statement-breakpoint
ALTER TABLE "market_printer_order" ADD CONSTRAINT "market_printer_order_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;