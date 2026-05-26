/*
  Warnings:

  - The primary key for the `Schedule` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[barberPhone,dayOfWeek]` on the table `Schedule` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `barberPhone` to the `Schedule` table without a default value. This is not possible if the table is not empty.
  - The required column `id` was added to the `Schedule` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `barberPhone` to the `ScheduleException` table without a default value. This is not possible if the table is not empty.
  - Added the required column `barberPhone` to the `Service` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('BARBER', 'CLIENT');

-- AlterTable
ALTER TABLE "Schedule" DROP CONSTRAINT "Schedule_pkey",
ADD COLUMN     "barberPhone" TEXT NOT NULL,
ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "Schedule_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "ScheduleException" ADD COLUMN     "barberPhone" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "barberPhone" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "name" VARCHAR(25),
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'CLIENT';

-- CreateIndex
CREATE UNIQUE INDEX "Schedule_barberPhone_dayOfWeek_key" ON "Schedule"("barberPhone", "dayOfWeek");

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_barberPhone_fkey" FOREIGN KEY ("barberPhone") REFERENCES "User"("phone") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_barberPhone_fkey" FOREIGN KEY ("barberPhone") REFERENCES "User"("phone") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleException" ADD CONSTRAINT "ScheduleException_barberPhone_fkey" FOREIGN KEY ("barberPhone") REFERENCES "User"("phone") ON DELETE RESTRICT ON UPDATE CASCADE;
