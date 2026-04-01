/*
  Warnings:

  - You are about to drop the column `timeIn` on the `AttendanceRecord` table. All the data in the column will be lost.
  - You are about to drop the column `timeOut` on the `AttendanceRecord` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "AttendanceRecord" DROP COLUMN "timeIn",
DROP COLUMN "timeOut",
ADD COLUMN     "amTimeIn" TIMESTAMP(3),
ADD COLUMN     "amTimeOut" TIMESTAMP(3),
ADD COLUMN     "pmTimeIn" TIMESTAMP(3),
ADD COLUMN     "pmTimeOut" TIMESTAMP(3);
