/*
  Warnings:

  - You are about to drop the `ContactPerson` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "ContactPerson_email_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ContactPerson";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Form" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "questions" TEXT NOT NULL,
    "projectType" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSprint0" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Form" ("createdAt", "id", "isActive", "projectType", "questions", "title", "updatedAt") SELECT "createdAt", "id", "isActive", "projectType", "questions", "title", "updatedAt" FROM "Form";
DROP TABLE "Form";
ALTER TABLE "new_Form" RENAME TO "Form";
CREATE TABLE "new_Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'MANUAL',
    "leadId" TEXT,
    "reviewerId" TEXT,
    "secondaryReviewerId" TEXT,
    "contactPersonId" TEXT,
    "pmId" TEXT,
    "devArchitectId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "closedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Project_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Project_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Project_secondaryReviewerId_fkey" FOREIGN KEY ("secondaryReviewerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Project_contactPersonId_fkey" FOREIGN KEY ("contactPersonId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Project_pmId_fkey" FOREIGN KEY ("pmId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Project_devArchitectId_fkey" FOREIGN KEY ("devArchitectId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Project" ("closedAt", "contactPersonId", "createdAt", "description", "devArchitectId", "id", "leadId", "name", "pmId", "reviewerId", "status", "type", "updatedAt") SELECT "closedAt", "contactPersonId", "createdAt", "description", "devArchitectId", "id", "leadId", "name", "pmId", "reviewerId", "status", "type", "updatedAt" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
CREATE UNIQUE INDEX "Project_name_key" ON "Project"("name");
CREATE TABLE "new_Review" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "secondaryReviewerId" TEXT,
    "formId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "healthStatus" TEXT NOT NULL DEFAULT 'On Track',
    "deferredReason" TEXT,
    "endedReason" TEXT,
    "onHoldReason" TEXT,
    "observations" TEXT,
    "recommendedActions" TEXT,
    "followUpComment" TEXT,
    "scheduledDate" DATETIME,
    "submittedDate" DATETIME,
    "answers" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Review_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Review_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Review_secondaryReviewerId_fkey" FOREIGN KEY ("secondaryReviewerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Review_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Review" ("answers", "createdAt", "deferredReason", "endedReason", "followUpComment", "formId", "healthStatus", "id", "observations", "onHoldReason", "projectId", "reviewerId", "scheduledDate", "status", "submittedDate", "updatedAt") SELECT "answers", "createdAt", "deferredReason", "endedReason", "followUpComment", "formId", "healthStatus", "id", "observations", "onHoldReason", "projectId", "reviewerId", "scheduledDate", "status", "submittedDate", "updatedAt" FROM "Review";
DROP TABLE "Review";
ALTER TABLE "new_Review" RENAME TO "Review";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
