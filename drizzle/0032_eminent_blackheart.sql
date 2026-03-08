ALTER TABLE "t2_review" ALTER COLUMN "shopScoreMultiplier" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "t2_review" ADD COLUMN "shopScore" real;