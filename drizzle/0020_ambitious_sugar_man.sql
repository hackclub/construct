ALTER TABLE "market_item_order" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "market_item_order" ALTER COLUMN "status" SET DEFAULT 'awaiting_approval'::text;--> statement-breakpoint
DROP TYPE "public"."market_order_status";--> statement-breakpoint
CREATE TYPE "public"."market_order_status" AS ENUM('awaiting_approval', 'fulfilled', 'denied', 'refunded');--> statement-breakpoint
ALTER TABLE "market_item_order" ALTER COLUMN "status" SET DEFAULT 'awaiting_approval'::"public"."market_order_status";--> statement-breakpoint
ALTER TABLE "market_item_order" ALTER COLUMN "status" SET DATA TYPE "public"."market_order_status" USING "status"::"public"."market_order_status";