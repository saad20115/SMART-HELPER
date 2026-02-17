-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Employee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "branch" TEXT,
    "employeeNumber" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "nationalId" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "basicSalary" DECIMAL NOT NULL,
    "housingAllowance" DECIMAL NOT NULL,
    "transportAllowance" DECIMAL NOT NULL,
    "otherAllowances" DECIMAL NOT NULL,
    "totalSalary" DECIMAL NOT NULL,
    "hireDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "terminationType" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Employee_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Employee" ("basicSalary", "branch", "companyId", "createdAt", "employeeNumber", "endDate", "fullName", "hireDate", "housingAllowance", "id", "jobTitle", "nationalId", "otherAllowances", "terminationType", "totalSalary", "transportAllowance", "updatedAt") SELECT "basicSalary", "branch", "companyId", "createdAt", "employeeNumber", "endDate", "fullName", "hireDate", "housingAllowance", "id", "jobTitle", "nationalId", "otherAllowances", "terminationType", "totalSalary", "transportAllowance", "updatedAt" FROM "Employee";
DROP TABLE "Employee";
ALTER TABLE "new_Employee" RENAME TO "Employee";
CREATE UNIQUE INDEX "Employee_companyId_nationalId_key" ON "Employee"("companyId", "nationalId");
CREATE UNIQUE INDEX "Employee_companyId_employeeNumber_key" ON "Employee"("companyId", "employeeNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
