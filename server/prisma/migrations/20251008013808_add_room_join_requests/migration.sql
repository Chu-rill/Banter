-- CreateEnum
CREATE TYPE "public"."RoomJoinStatus" AS ENUM ('PENDING', 'APPROVED', 'DENIED');

-- CreateTable
CREATE TABLE "public"."RoomJoinRequest" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "public"."RoomJoinStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoomJoinRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RoomJoinRequest_roomId_status_idx" ON "public"."RoomJoinRequest"("roomId", "status");

-- CreateIndex
CREATE INDEX "RoomJoinRequest_userId_idx" ON "public"."RoomJoinRequest"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RoomJoinRequest_roomId_userId_key" ON "public"."RoomJoinRequest"("roomId", "userId");

-- AddForeignKey
ALTER TABLE "public"."RoomJoinRequest" ADD CONSTRAINT "RoomJoinRequest_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "public"."Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RoomJoinRequest" ADD CONSTRAINT "RoomJoinRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
