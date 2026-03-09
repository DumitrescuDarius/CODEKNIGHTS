/*
  Warnings:

  - You are about to drop the `Duel` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "Question" ADD COLUMN "hiddenTestCases" TEXT;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Duel";
PRAGMA foreign_keys=on;
