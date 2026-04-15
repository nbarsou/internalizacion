/*
  Warnings:

  - You are about to drop the column `beneficiario` on the `agreement` table. All the data in the column will be lost.
  - You are about to drop the column `comments` on the `agreement` table. All the data in the column will be lost.
  - You are about to drop the column `inicio` on the `agreement` table. All the data in the column will be lost.
  - You are about to drop the column `plazas_lic` on the `agreement` table. All the data in the column will be lost.
  - You are about to drop the column `plazas_pos` on the `agreement` table. All the data in the column will be lost.
  - You are about to drop the column `se_usa` on the `agreement` table. All the data in the column will be lost.
  - You are about to drop the column `vigencia` on the `agreement` table. All the data in the column will be lost.
  - You are about to drop the column `nombre` on the `contact` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `contact` table. All the data in the column will be lost.
  - You are about to drop the column `nombre` on the `ref_agreement_type` table. All the data in the column will be lost.
  - You are about to drop the column `nombre` on the `ref_attr` table. All the data in the column will be lost.
  - You are about to drop the column `nombre` on the `ref_campus` table. All the data in the column will be lost.
  - You are about to drop the column `nombre` on the `ref_giro` table. All the data in the column will be lost.
  - You are about to drop the column `nombre` on the `ref_pais` table. All the data in the column will be lost.
  - You are about to drop the column `nombre` on the `ref_region` table. All the data in the column will be lost.
  - You are about to drop the column `nombre` on the `ref_status` table. All the data in the column will be lost.
  - You are about to drop the column `catholica` on the `university` table. All the data in the column will be lost.
  - You are about to drop the column `ciudad` on the `university` table. All the data in the column will be lost.
  - You are about to drop the column `comments` on the `university` table. All the data in the column will be lost.
  - You are about to drop the column `giroId` on the `university` table. All the data in the column will be lost.
  - You are about to drop the column `nombre` on the `university` table. All the data in the column will be lost.
  - You are about to drop the column `paisId` on the `university` table. All the data in the column will be lost.
  - You are about to drop the column `qs_ranking` on the `university` table. All the data in the column will be lost.
  - You are about to drop the `contact_info` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[name]` on the table `ref_agreement_type` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `ref_attr` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `ref_campus` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `ref_giro` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `ref_pais` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `ref_region` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[value]` on the table `ref_status` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `concernType` to the `contact` table without a default value. This is not possible if the table is not empty.
  - Added the required column `value` to the `contact` table without a default value. This is not possible if the table is not empty.
  - Added the required column `valueType` to the `contact` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `ref_agreement_type` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `ref_attr` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `ref_campus` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `ref_giro` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `ref_pais` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `ref_region` table without a default value. This is not possible if the table is not empty.
  - Added the required column `value` to the `ref_status` table without a default value. This is not possible if the table is not empty.
  - Added the required column `countryId` to the `university` table without a default value. This is not possible if the table is not empty.
  - Added the required column `institutionTypeId` to the `university` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `university` table without a default value. This is not possible if the table is not empty.
  - Added the required column `start` to the `university` table without a default value. This is not possible if the table is not empty.
  - Added the required column `utilizationId` to the `university` table without a default value. This is not possible if the table is not empty.
  - Made the column `campusId` on table `university` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "ContactConcernType" AS ENUM ('INCOMING', 'OUTGOING', 'GENERAL');

-- CreateEnum
CREATE TYPE "ContactValueType" AS ENUM ('EMAIL', 'PHONE');

-- CreateEnum
CREATE TYPE "ObservationOrigin" AS ENUM ('GENERATED', 'MANUAL');

-- CreateEnum
CREATE TYPE "ObservationLevel" AS ENUM ('ERROR', 'WARNING', 'INFO');

-- DropForeignKey
ALTER TABLE "contact_info" DROP CONSTRAINT "contact_info_contactId_fkey";

-- DropForeignKey
ALTER TABLE "university" DROP CONSTRAINT "university_campusId_fkey";

-- DropForeignKey
ALTER TABLE "university" DROP CONSTRAINT "university_giroId_fkey";

-- DropForeignKey
ALTER TABLE "university" DROP CONSTRAINT "university_paisId_fkey";

-- DropIndex
DROP INDEX "ref_agreement_type_nombre_key";

-- DropIndex
DROP INDEX "ref_attr_nombre_key";

-- DropIndex
DROP INDEX "ref_campus_nombre_key";

-- DropIndex
DROP INDEX "ref_giro_nombre_key";

-- DropIndex
DROP INDEX "ref_pais_nombre_key";

-- DropIndex
DROP INDEX "ref_region_nombre_key";

-- DropIndex
DROP INDEX "ref_status_nombre_key";

-- AlterTable
ALTER TABLE "agreement" DROP COLUMN "beneficiario",
DROP COLUMN "comments",
DROP COLUMN "inicio",
DROP COLUMN "plazas_lic",
DROP COLUMN "plazas_pos",
DROP COLUMN "se_usa",
DROP COLUMN "vigencia",
ADD COLUMN     "spots" INTEGER;

-- AlterTable
ALTER TABLE "contact" DROP COLUMN "nombre",
DROP COLUMN "type",
ADD COLUMN     "concernType" "ContactConcernType" NOT NULL,
ADD COLUMN     "name" VARCHAR(255),
ADD COLUMN     "value" VARCHAR(255) NOT NULL,
ADD COLUMN     "valueType" "ContactValueType" NOT NULL;

-- AlterTable
ALTER TABLE "ref_agreement_type" DROP COLUMN "nombre",
ADD COLUMN     "name" VARCHAR(150) NOT NULL;

-- AlterTable
ALTER TABLE "ref_attr" DROP COLUMN "nombre",
ADD COLUMN     "name" VARCHAR(150) NOT NULL;

-- AlterTable
ALTER TABLE "ref_campus" DROP COLUMN "nombre",
ADD COLUMN     "name" VARCHAR(150) NOT NULL;

-- AlterTable
ALTER TABLE "ref_giro" DROP COLUMN "nombre",
ADD COLUMN     "name" VARCHAR(150) NOT NULL;

-- AlterTable
ALTER TABLE "ref_pais" DROP COLUMN "nombre",
ADD COLUMN     "name" VARCHAR(150) NOT NULL;

-- AlterTable
ALTER TABLE "ref_region" DROP COLUMN "nombre",
ADD COLUMN     "name" VARCHAR(150) NOT NULL;

-- AlterTable
ALTER TABLE "ref_status" DROP COLUMN "nombre",
ADD COLUMN     "value" VARCHAR(150) NOT NULL;

-- AlterTable
ALTER TABLE "university" DROP COLUMN "catholica",
DROP COLUMN "ciudad",
DROP COLUMN "comments",
DROP COLUMN "giroId",
DROP COLUMN "nombre",
DROP COLUMN "paisId",
DROP COLUMN "qs_ranking",
ADD COLUMN     "city" VARCHAR(150),
ADD COLUMN     "countryId" INTEGER NOT NULL,
ADD COLUMN     "expires" TIMESTAMP(3),
ADD COLUMN     "institutionTypeId" INTEGER NOT NULL,
ADD COLUMN     "isCatholic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "name" VARCHAR(255) NOT NULL,
ADD COLUMN     "start" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "utilizationId" INTEGER NOT NULL,
ALTER COLUMN "campusId" SET NOT NULL;

-- DropTable
DROP TABLE "contact_info";

-- DropEnum
DROP TYPE "ContactInfoType";

-- DropEnum
DROP TYPE "ContactType";

-- CreateTable
CREATE TABLE "ref_utilization" (
    "id" SERIAL NOT NULL,
    "value" VARCHAR(150) NOT NULL,
    "color" VARCHAR(7),

    CONSTRAINT "ref_utilization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ref_beneficiary" (
    "id" SERIAL NOT NULL,
    "cve" VARCHAR(10) NOT NULL,
    "name" VARCHAR(150) NOT NULL,

    CONSTRAINT "ref_beneficiary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "observation" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "origin" "ObservationOrigin" NOT NULL,
    "level" "ObservationLevel" NOT NULL,
    "source" VARCHAR(100),
    "universityId" TEXT,
    "agreementId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "observation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agreement_beneficiary" (
    "agreementId" TEXT NOT NULL,
    "beneficiaryId" INTEGER NOT NULL,

    CONSTRAINT "agreement_beneficiary_pkey" PRIMARY KEY ("agreementId","beneficiaryId")
);

-- CreateIndex
CREATE UNIQUE INDEX "ref_utilization_value_key" ON "ref_utilization"("value");

-- CreateIndex
CREATE UNIQUE INDEX "ref_beneficiary_cve_key" ON "ref_beneficiary"("cve");

-- CreateIndex
CREATE UNIQUE INDEX "ref_beneficiary_name_key" ON "ref_beneficiary"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ref_agreement_type_name_key" ON "ref_agreement_type"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ref_attr_name_key" ON "ref_attr"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ref_campus_name_key" ON "ref_campus"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ref_giro_name_key" ON "ref_giro"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ref_pais_name_key" ON "ref_pais"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ref_region_name_key" ON "ref_region"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ref_status_value_key" ON "ref_status"("value");

-- AddForeignKey
ALTER TABLE "university" ADD CONSTRAINT "university_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "ref_pais"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "university" ADD CONSTRAINT "university_institutionTypeId_fkey" FOREIGN KEY ("institutionTypeId") REFERENCES "ref_giro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "university" ADD CONSTRAINT "university_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "ref_campus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "university" ADD CONSTRAINT "university_utilizationId_fkey" FOREIGN KEY ("utilizationId") REFERENCES "ref_utilization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "observation" ADD CONSTRAINT "observation_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "university"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "observation" ADD CONSTRAINT "observation_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "agreement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agreement_beneficiary" ADD CONSTRAINT "agreement_beneficiary_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "agreement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agreement_beneficiary" ADD CONSTRAINT "agreement_beneficiary_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "ref_beneficiary"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
