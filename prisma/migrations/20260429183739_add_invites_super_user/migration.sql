/*
  Warnings:

  - You are about to drop the column `pagina_web` on the `university` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "university" DROP COLUMN "pagina_web",
ADD COLUMN     "web_page" VARCHAR(500);

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "isSuperuser" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "permissionExpiresAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "pending_invite" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'VIEWER',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "refRegionId" INTEGER,

    CONSTRAINT "pending_invite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pending_invite_email_key" ON "pending_invite"("email");

-- AddForeignKey
ALTER TABLE "pending_invite" ADD CONSTRAINT "pending_invite_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pending_invite" ADD CONSTRAINT "pending_invite_refRegionId_fkey" FOREIGN KEY ("refRegionId") REFERENCES "ref_region"("id") ON DELETE SET NULL ON UPDATE CASCADE;
