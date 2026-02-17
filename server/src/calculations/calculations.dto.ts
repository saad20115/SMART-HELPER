import { IsOptional, IsString, IsDateString, IsEnum } from 'class-validator';

export enum EmployeeStatus {
    ACTIVE = 'ACTIVE',
    TERMINATED = 'TERMINATED',
    ALL = 'ALL'
}

export class AggregatedCalculationsQueryDto {
    @IsOptional()
    @IsDateString()
    fiscalYearEnd?: string; // e.g., "2026-12-31"

    @IsOptional()
    @IsString()
    branch?: string;

    @IsOptional()
    @IsString()
    jobTitle?: string;

    @IsOptional()
    @IsString()
    department?: string;

    @IsOptional()
    @IsString()
    classification?: string;

    @IsOptional()
    @IsEnum(EmployeeStatus)
    status?: EmployeeStatus;
}

export interface EmployeeEntitlementDto {
    id: string;
    employeeNumber: string;
    fullName: string;
    branch: string | null;
    department: string | null;
    classification: string | null;
    jobTitle: string;
    hireDate: string;
    endDate: string | null;
    serviceYears: number;
    basicSalary: number;
    totalSalary: number;

    // Calculations
    grossEOS: number;
    netEOS: number;
    entitlementRatio: number;
    leaveCompensation: number;
    leaveBalanceDays: number; // Added leave balance days
    totalDeductions: number;
    finalPayable: number;

    // Additional info
    terminationType: string | null;
    isActive: boolean;
}

export interface AggregatedSummaryDto {
    totalEmployees: number;
    totalActiveEmployees: number;
    totalTerminatedEmployees: number;
    totalGrossEOS: number;
    totalNetEOS: number;
    totalLeaveCompensation: number;
    totalDeductions: number;
    totalFinalPayable: number;
    averageServiceYears: number;
}

export interface DepartmentBreakdownDto {
    department: string;
    employeeCount: number;
    totalEntitlements: number;
}

export interface ClassificationBreakdownDto {
    classification: string;
    employeeCount: number;
    totalEntitlements: number;
}

export interface BranchBreakdownDto {
    branch: string;
    employeeCount: number;
    totalEntitlements: number;
}

export interface JobTitleBreakdownDto {
    jobTitle: string;
    employeeCount: number;
    totalEntitlements: number;
}

export interface AggregatedCalculationsResponseDto {
    summary: AggregatedSummaryDto;
    employees: EmployeeEntitlementDto[];
    branchBreakdown: BranchBreakdownDto[];
    jobTitleBreakdown: JobTitleBreakdownDto[];
    departmentBreakdown: DepartmentBreakdownDto[];
    classificationBreakdown: ClassificationBreakdownDto[];
    filters: {
        fiscalYearEnd?: string;
        branch?: string;
        department?: string;
        classification?: string;
        jobTitle?: string;
        status?: EmployeeStatus;
    };
}
