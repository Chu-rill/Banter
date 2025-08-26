/*
  Warnings:

  - A unique constraint covering the columns `[requesterId,receiverId]` on the table `Friendship` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Friendship_requesterId_receiverId_key" ON "public"."Friendship"("requesterId", "receiverId");
