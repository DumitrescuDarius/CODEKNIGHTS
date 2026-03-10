-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Duel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pin" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "guestId" TEXT,
    "hostReady" BOOLEAN NOT NULL DEFAULT false,
    "guestReady" BOOLEAN NOT NULL DEFAULT false,
    "hostSolveTime" INTEGER,
    "guestSolveTime" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    CONSTRAINT "Duel_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Duel_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Duel_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Duel" ("createdAt", "expiresAt", "guestId", "guestReady", "guestSolveTime", "hostId", "hostReady", "hostSolveTime", "id", "pin", "questionId", "status") SELECT "createdAt", "expiresAt", "guestId", "guestReady", "guestSolveTime", "hostId", "hostReady", "hostSolveTime", "id", "pin", "questionId", "status" FROM "Duel";
DROP TABLE "Duel";
ALTER TABLE "new_Duel" RENAME TO "Duel";
CREATE UNIQUE INDEX "Duel_pin_key" ON "Duel"("pin");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
