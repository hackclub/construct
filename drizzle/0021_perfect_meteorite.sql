ALTER TABLE "t2_review" ADD COLUMN "shopScoreMultiplier" real DEFAULT 25 NOT NULL;--> statement-breakpoint
ALTER TABLE "t2_review" DROP COLUMN "currencyMultiplier";