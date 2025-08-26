-- AlterTable
ALTER TABLE "public"."DirectMessage" ADD COLUMN     "isRead" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."Message" ADD COLUMN     "isRead" BOOLEAN NOT NULL DEFAULT false;
