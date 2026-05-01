/*
  Warnings:

  - You are about to drop the column `name` on the `ref_agreement_type` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `ref_attr` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `ref_beneficiary` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `ref_campus` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `ref_giro` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `ref_pais` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `ref_region` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[value]` on the table `ref_agreement_type` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[value]` on the table `ref_attr` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[value]` on the table `ref_beneficiary` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[value]` on the table `ref_campus` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[value]` on the table `ref_giro` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[value]` on the table `ref_pais` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[value]` on the table `ref_region` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `value` to the `ref_agreement_type` table without a default value. This is not possible if the table is not empty.
  - Added the required column `value` to the `ref_attr` table without a default value. This is not possible if the table is not empty.
  - Added the required column `value` to the `ref_beneficiary` table without a default value. This is not possible if the table is not empty.
  - Added the required column `value` to the `ref_campus` table without a default value. This is not possible if the table is not empty.
  - Added the required column `value` to the `ref_giro` table without a default value. This is not possible if the table is not empty.
  - Added the required column `value` to the `ref_pais` table without a default value. This is not possible if the table is not empty.
  - Added the required column `value` to the `ref_region` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "ref_agreement_type_name_key";

-- DropIndex
DROP INDEX "ref_attr_name_key";

-- DropIndex
DROP INDEX "ref_beneficiary_name_key";

-- DropIndex
DROP INDEX "ref_campus_name_key";

-- DropIndex
DROP INDEX "ref_giro_name_key";

-- DropIndex
DROP INDEX "ref_pais_name_key";

-- DropIndex
DROP INDEX "ref_region_name_key";

-- AlterTable
ALTER TABLE "ref_agreement_type" DROP COLUMN "name",
ADD COLUMN     "value" VARCHAR(150) NOT NULL;

-- AlterTable
ALTER TABLE "ref_attr" DROP COLUMN "name",
ADD COLUMN     "value" VARCHAR(150) NOT NULL;

-- AlterTable
ALTER TABLE "ref_beneficiary" DROP COLUMN "name",
ADD COLUMN     "value" VARCHAR(150) NOT NULL;

-- AlterTable
ALTER TABLE "ref_campus" DROP COLUMN "name",
ADD COLUMN     "value" VARCHAR(150) NOT NULL;

-- AlterTable
ALTER TABLE "ref_giro" DROP COLUMN "name",
ADD COLUMN     "value" VARCHAR(150) NOT NULL;

-- AlterTable
ALTER TABLE "ref_pais" DROP COLUMN "name",
ADD COLUMN     "value" VARCHAR(150) NOT NULL;

-- AlterTable
ALTER TABLE "ref_region" DROP COLUMN "name",
ADD COLUMN     "value" VARCHAR(150) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ref_agreement_type_value_key" ON "ref_agreement_type"("value");

-- CreateIndex
CREATE UNIQUE INDEX "ref_attr_value_key" ON "ref_attr"("value");

-- CreateIndex
CREATE UNIQUE INDEX "ref_beneficiary_value_key" ON "ref_beneficiary"("value");

-- CreateIndex
CREATE UNIQUE INDEX "ref_campus_value_key" ON "ref_campus"("value");

-- CreateIndex
CREATE UNIQUE INDEX "ref_giro_value_key" ON "ref_giro"("value");

-- CreateIndex
CREATE UNIQUE INDEX "ref_pais_value_key" ON "ref_pais"("value");

-- CreateIndex
CREATE UNIQUE INDEX "ref_region_value_key" ON "ref_region"("value");
