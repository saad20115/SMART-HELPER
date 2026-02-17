-- إنشاء Enums
CREATE TYPE "Role" AS ENUM ('ADMIN', 'HR', 'ACCOUNTANT');
CREATE TYPE "TerminationType" AS ENUM ('RESIGNATION', 'TERMINATION', 'CONTRACT_END');
CREATE TYPE "DeductionType" AS ENUM ('LOAN', 'PENALTY', 'ADVANCE', 'OTHER');
CREATE TYPE "ImportStatus" AS ENUM ('PROCESSING', 'COMPLETED', 'FAILED');
CREATE TYPE "LeaveTransactionType" AS ENUM ('ACCRUAL', 'USAGE', 'ADJUSTMENT', 'ENCASHMENT');
CREATE TYPE "FileFormat" AS ENUM ('XLSX', 'CSV', 'PDF', 'JSON');
-- Company Table
CREATE TABLE "Company" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "name" TEXT NOT NULL,
    "crNumber" TEXT NOT NULL UNIQUE,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- User Table
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL UNIQUE,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
-- Employee Table
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "companyId" TEXT NOT NULL,
    "branch" TEXT,
    "employeeNumber" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "nationalId" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "basicSalary" DECIMAL(10, 2) NOT NULL,
    "housingAllowance" DECIMAL(10, 2) NOT NULL,
    "transportAllowance" DECIMAL(10, 2) NOT NULL,
    "otherAllowances" DECIMAL(10, 2) NOT NULL,
    "totalSalary" DECIMAL(10, 2) NOT NULL,
    "hireDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "terminationType" "TerminationType",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Employee_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Employee_companyId_nationalId_key" UNIQUE("companyId", "nationalId"),
    CONSTRAINT "Employee_companyId_employeeNumber_key" UNIQUE("companyId", "employeeNumber")
);
-- LeaveBalance Table
CREATE TABLE "LeaveBalance" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "employeeId" TEXT NOT NULL,
    "annualEntitledDays" INTEGER NOT NULL,
    "annualUsedDays" INTEGER NOT NULL,
    "calculatedRemainingDays" INTEGER NOT NULL,
    "leaveValue" DECIMAL(10, 2) NOT NULL,
    "lastCalculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LeaveBalance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
-- LeaveTransaction Table
CREATE TABLE "LeaveTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "employeeId" TEXT NOT NULL,
    "leaveBalanceId" TEXT,
    "type" "LeaveTransactionType" NOT NULL,
    "days" DECIMAL(5, 2) NOT NULL,
    "reason" TEXT,
    "performedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LeaveTransaction_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LeaveTransaction_leaveBalanceId_fkey" FOREIGN KEY ("leaveBalanceId") REFERENCES "LeaveBalance"("id") ON DELETE
    SET NULL ON UPDATE CASCADE
);
-- Deduction Table
CREATE TABLE "Deduction" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "employeeId" TEXT NOT NULL,
    "type" "DeductionType" NOT NULL,
    "amount" DECIMAL(10, 2) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Deduction_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
-- EosCalculation Table
CREATE TABLE "EosCalculation" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "employeeId" TEXT NOT NULL,
    "serviceYears" DECIMAL(5, 2) NOT NULL,
    "grossEosAmount" DECIMAL(12, 2) NOT NULL,
    "leaveCompensation" DECIMAL(10, 2) NOT NULL,
    "totalDeductions" DECIMAL(10, 2) NOT NULL,
    "netPayable" DECIMAL(12, 2) NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EosCalculation_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
-- ImportLog Table
CREATE TABLE "ImportLog" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "companyId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "totalRows" INTEGER NOT NULL,
    "successRows" INTEGER NOT NULL,
    "failedRows" INTEGER NOT NULL,
    "status" "ImportStatus" NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ImportLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
-- ImportError Table
CREATE TABLE "ImportError" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "importLogId" TEXT NOT NULL,
    "rowNumber" INTEGER NOT NULL,
    "fieldName" TEXT,
    "errorMessage" TEXT NOT NULL,
    CONSTRAINT "ImportError_importLogId_fkey" FOREIGN KEY ("importLogId") REFERENCES "ImportLog"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
-- ExportLog Table
CREATE TABLE "ExportLog" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "companyId" TEXT NOT NULL,
    "exportType" TEXT NOT NULL,
    "fileFormat" "FileFormat" NOT NULL,
    "generatedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExportLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
-- إنشاء Indexes للأداء
CREATE INDEX "User_companyId_idx" ON "User"("companyId");
CREATE INDEX "Employee_companyId_idx" ON "Employee"("companyId");
CREATE INDEX "LeaveBalance_employeeId_idx" ON "LeaveBalance"("employeeId");
CREATE INDEX "LeaveTransaction_employeeId_idx" ON "LeaveTransaction"("employeeId");
CREATE INDEX "Deduction_employeeId_idx" ON "Deduction"("employeeId");
CREATE INDEX "EosCalculation_employeeId_idx" ON "EosCalculation"("employeeId");