import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AggregatedCalculationsQueryDto,
  AggregatedCalculationsResponseDto,
  EmployeeEntitlementDto,
  EmployeeStatus,
} from './calculations.dto';

@Injectable()
export class EosCalculationService {
  constructor(private prisma: PrismaService) { }

  /**
   * Calculate End of Service Benefits (EOSB)
   * @param employeeId
   */
  async calculateEOS(employeeId: string, terminationTypeOverride?: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { deductions: true, leaveBalances: true },
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    const {
      hireDate,
      endDate,
      basicSalary,
      housingAllowance,
      transportAllowance,
      otherAllowances,
    } = employee;

    const terminationType = terminationTypeOverride || employee.terminationType;

    if (!endDate) {
      throw new Error('Employee must have an end date to calculate EOS');
    }

    // 1. Calculate Service Duration (Precise)
    const start = new Date(hireDate);
    const end = new Date(endDate);
    const durationInMs = end.getTime() - start.getTime();
    const durationInDays = durationInMs / (1000 * 60 * 60 * 24);

    // Saudi Labor Law uses 360 days or Gregorian 365.25?
    // Standard practice: Service Years = Days / 365.25 for accuracy with Gregorian calendar.
    const serviceYears = durationInDays / 365.25;

    // 2. Base Calculation (Gross EOS)
    // Rule: Half salary for first 5 years, Full salary for subsequent years.
    // Article 84: EOS is based on the LAST WAGE.
    // UPDATED: EOS uses Basic Salary only. Leave uses Total Salary.
    const totalSalary = Number(employee.totalSalary);
    const basicSalaryVal = Number(basicSalary);

    let grossEOS = 0;

    // First 5 Years Calculation
    const firstPeriodYears = Math.min(serviceYears, 5);
    grossEOS += firstPeriodYears * 0.5 * basicSalaryVal;

    // Subsequent Years Calculation
    if (serviceYears > 5) {
      const remainingYears = serviceYears - 5;
      grossEOS += remainingYears * 1.0 * basicSalaryVal;
    }

    // 3. Apply Resignation Logic (Article 85)
    let entitlementRatio = 1.0;

    if (terminationType === 'RESIGNATION') {
      if (serviceYears < 2) {
        entitlementRatio = 0; // Article 85: No award if < 2 years
      } else if (serviceYears < 5) {
        entitlementRatio = 1 / 3; // Article 85: 1/3 award if 2 <= years < 5
      } else if (serviceYears < 10) {
        entitlementRatio = 2 / 3; // Article 85: 2/3 award if 5 <= years < 10
      } else {
        entitlementRatio = 1.0; // Full award if >= 10 years
      }
    } else if (
      terminationType === 'TERMINATION' ||
      terminationType === 'CONTRACT_END'
    ) {
      // Article 84: Full award for termination by employer or contract expiration
      entitlementRatio = 1.0;
    }

    const netEOS = grossEOS * entitlementRatio;

    // 4. Leave Compensation (Article 111)
    // "The worker is entitled to his wage for the accrued days of the leave if he leaves the work before using them."
    // Wage = Gross Salary (Basic + Allowances)
    // Rate = Gross Salary / 30

    const leaveBalance = employee.leaveBalances[0]; // Active balance
    let leaveCompensation = 0;

    if (leaveBalance && Number(leaveBalance.calculatedRemainingDays) > 0) {
      const dailyWage = totalSalary / 30;
      // Valued at CURRENT salary (Last Wage), regardless of when it was accrued.
      leaveCompensation =
        dailyWage * Number(leaveBalance.calculatedRemainingDays);
    }

    // 5. Deductions
    // PENDING = owed but not yet paid | COMPLETED = already paid out (e.g. EOS paid up to end-2020)
    // Both must be deducted. Only CANCELLED are excluded.
    const totalDeductions = employee.deductions
      .filter((d) => d.status !== 'CANCELLED')
      .reduce((sum, d) => sum + Number(d.amount), 0);

    // 6. Final Net Payable
    const finalPayable = netEOS + leaveCompensation - totalDeductions;

    return {
      serviceYears: serviceYears.toFixed(2),
      grossEOS: grossEOS.toFixed(2),
      entitlementRatio: entitlementRatio.toFixed(2),
      netEOS: netEOS.toFixed(2),
      leaveCompensation: leaveCompensation.toFixed(2),
      totalDeductions: totalDeductions.toFixed(2),
      finalPayable: finalPayable.toFixed(2),
    };
  }

  /**
   * Calculate Vacation (Leave) Pay
   * @param employeeId
   * @param manualDays Optional: Manual override for leave days
   */
  async calculateVacation(employeeId: string, manualDays?: number) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { leaveBalances: true },
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    const totalSalary = Number(employee.totalSalary);
    // Standard in Saudi Labor Law: Daily Wage = Total Salary / 30
    const dailyWage = totalSalary / 30;

    let leaveDays = 0;
    let isManual = false;

    if (manualDays !== undefined && manualDays !== null) {
      leaveDays = Number(manualDays);
      isManual = true;
    } else {
      // Default to current calculated remaining days from the active balance
      // Assuming the first balance is the active one for now
      const balance = employee.leaveBalances[0];
      if (balance) {
        leaveDays = Number(balance.calculatedRemainingDays);
      }
    }

    const totalAmount = dailyWage * leaveDays;

    return {
      employeeName: employee.fullName,
      totalSalary: totalSalary.toFixed(2),
      dailyWage: dailyWage.toFixed(2),
      leaveDays: leaveDays.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
      isManual,
    };
  }

  /**
   * Calculate Aggregated Entitlements for All Employees
   * @param query Filter options
   */
  async calculateAggregatedEntitlements(
    query: AggregatedCalculationsQueryDto,
  ): Promise<AggregatedCalculationsResponseDto> {
    // Build where clause based on filters
    const where: any = {};

    // Filter by company
    if (query.companyId) {
      where.companyId = query.companyId;
    }

    // Filter by fiscal year end (employees hired before this date)
    if (query.fiscalYearEnd) {
      const filterDate = new Date(query.fiscalYearEnd);
      if (!isNaN(filterDate.getTime())) {
        where.hireDate = {
          lte: filterDate,
        };
      }
    }

    // Filter by branch
    if (query.branch) {
      where.branch = query.branch;
    }

    // Filter by job title
    if (query.jobTitle) {
      where.jobTitle = query.jobTitle;
    }

    // Filter by department
    if (query.department) {
      where.department = query.department;
    }

    // Filter by classification
    if (query.classification) {
      where.classification = query.classification;
    }

    // Filter by employee status
    if (query.status && query.status !== EmployeeStatus.ALL) {
      if (query.status === EmployeeStatus.ACTIVE) {
        where.endDate = null;
      } else if (query.status === EmployeeStatus.TERMINATED) {
        where.endDate = { not: null };
      }
    }

    // Fetch all employees matching the criteria
    const employees = await this.prisma.employee.findMany({
      where,
      include: {
        deductions: true,
        leaveBalances: true,
        leaveTransactions: true,
      },
      orderBy: {
        fullName: 'asc',
      },
    });

    // Calculate entitlements for each employee
    const employeeEntitlements: EmployeeEntitlementDto[] = [];
    let totalGrossEOS = 0;
    let totalNetEOS = 0;
    let totalLeaveCompensation = 0;
    let totalLeaveDeductions = 0;
    let totalOtherDeductions = 0;
    let totalDeductions = 0;
    let totalFinalPayable = 0;
    let totalServiceYears = 0;
    let activeCount = 0;
    let terminatedCount = 0;

    // Branch, job title, department, and classification breakdown maps
    const branchMap = new Map<string, { count: number; total: number; totalLeave: number }>();
    const jobTitleMap = new Map<string, { count: number; total: number; totalLeave: number }>();
    const departmentMap = new Map<string, { count: number; total: number; totalLeave: number }>();
    const classificationMap = new Map<
      string,
      { count: number; total: number; totalLeave: number }
    >();

    const calculationDate = query.snapshotDate
      ? new Date(query.snapshotDate)
      : query.fiscalYearEnd
        ? new Date(query.fiscalYearEnd)
        : new Date();

    const isSnapshot = !!query.snapshotDate;
    const snapshotDate = isSnapshot ? new Date(query.snapshotDate!) : null;

    for (const employee of employees) {
      // Snapshot filtering: skip employees hired after snapshot or terminated before snapshot
      if (snapshotDate) {
        if (new Date(employee.hireDate) > snapshotDate) continue;
        if (employee.endDate && new Date(employee.endDate) < snapshotDate) {
          // Employee was already terminated before snapshot — still include them as terminated
        }
      }

      const isActive = snapshotDate
        ? !employee.endDate || new Date(employee.endDate) > snapshotDate
        : !employee.endDate;
      if (isActive) activeCount++;
      else terminatedCount++;

      // Calculate service years
      const start = new Date(employee.hireDate);
      const end = employee.endDate
        ? new Date(employee.endDate)
        : calculationDate;
      const durationInMs = end.getTime() - start.getTime();
      const durationInDays = durationInMs / (1000 * 60 * 60 * 24);
      const serviceYears = durationInDays / 365.25;

      const totalSalary = Number(employee.totalSalary);
      const basicSalary = Number(employee.basicSalary);

      // Calculate Gross EOS (Using Basic Salary)
      let grossEOS = 0;
      const firstPeriodYears = Math.min(serviceYears, 5);
      grossEOS += firstPeriodYears * 0.5 * basicSalary;
      if (serviceYears > 5) {
        const remainingYears = serviceYears - 5;
        grossEOS += remainingYears * 1.0 * basicSalary;
      }

      // Apply entitlement ratio based on termination type
      // Apply entitlement ratio based on termination type
      // Default to RESIGNATION logic for active employees to show realistic liability
      const terminationType = employee.terminationType;
      let entitlementRatio = 1.0;

      if (terminationType === 'RESIGNATION') {
        if (serviceYears < 2) {
          entitlementRatio = 0;
        } else if (serviceYears < 5) {
          entitlementRatio = 1 / 3;
        } else if (serviceYears < 10) {
          entitlementRatio = 2 / 3;
        } else {
          entitlementRatio = 1.0;
        }
      } else if (
        terminationType === 'TERMINATION' ||
        terminationType === 'CONTRACT_END'
      ) {
        entitlementRatio = 1.0;
      }

      const netEOS = grossEOS * entitlementRatio;

      // ✅ FIX: Use stored LeaveBalance.calculatedRemainingDays from DB
      // For snapshot mode: dynamically compute leave balance at that point in time
      const storedBalance = employee.leaveBalances[0];
      let leaveBalanceDays = 0;

      if (snapshotDate) {
        // Dynamic calculation for historical snapshot
        const hireDate = new Date(employee.hireDate);
        const totalServiceYearsFromHire = (snapshotDate.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
        const annualRate = totalServiceYearsFromHire >= 5 ? 30 : 21;

        // Leave accrual starts from 2021 for old employees
        const accrualStart = hireDate < new Date('2021-01-01') ? new Date('2021-01-01') : hireDate;
        const accrualEndDate = snapshotDate < new Date() ? snapshotDate : new Date();
        const accrualYears = Math.max(0, (accrualEndDate.getTime() - accrualStart.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
        const totalAccrued = accrualYears * annualRate;

        // Used days: from stored balance (best available data)
        const usedDays = storedBalance ? Number(storedBalance.annualUsedDays) : 0;
        // For snapshot, prorate used days if snapshot is before today
        leaveBalanceDays = totalAccrued - usedDays;
      } else if (storedBalance) {
        leaveBalanceDays = Number(storedBalance.calculatedRemainingDays);
      } else {
        if (serviceYears < 5) {
          leaveBalanceDays = serviceYears * 21;
        } else {
          leaveBalanceDays = 5 * 21 + (serviceYears - 5) * 30;
        }
      }

      // Clamp to reasonable bounds: max 300 days (hard cap per Saudi Labor Law)
      leaveBalanceDays = Math.min(leaveBalanceDays, 300);
      const effectiveLeaveBalance = Math.max(leaveBalanceDays, 0);

      let leaveCompensation = 0;
      if (effectiveLeaveBalance > 0) {
        const dailyWage = totalSalary / 30;
        leaveCompensation = dailyWage * effectiveLeaveBalance;
      }

      // Calculate total deductions
      // PENDING = amount owed but not yet paid | COMPLETED = already paid out (advance)
      // Both must be deducted from EOS. Only CANCELLED are excluded.
      // For snapshot: only include deductions created before the snapshot date
      const otherDeductions = employee.deductions
        .filter((d) => d.status !== 'CANCELLED')
        .filter((d) => !snapshotDate || new Date(d.createdAt) <= snapshotDate)
        .reduce((sum, d) => sum + Number(d.amount), 0);

      // 2. "Leave Deductions" = Only if employee has a genuinely negative balance
      let leaveDeductions = 0;
      if (leaveBalanceDays < 0) {
        const dailyWage = totalSalary / 30;
        leaveDeductions = Math.abs(leaveBalanceDays) * dailyWage;
      }

      const deductions = leaveDeductions + otherDeductions;

      // Final payable — can be negative if employee received advance payments > current entitlement
      const finalPayable = netEOS + leaveCompensation - deductions;

      // Add to employee entitlements
      employeeEntitlements.push({
        id: employee.id,
        employeeNumber: employee.employeeNumber,
        fullName: employee.fullName,
        branch: employee.branch,
        department: employee.department,
        classification: employee.classification,
        jobTitle: employee.jobTitle,
        hireDate: employee.hireDate.toISOString(),
        endDate: employee.endDate?.toISOString() || null,
        serviceYears: Number(serviceYears.toFixed(2)),
        basicSalary: Number(employee.basicSalary),
        totalSalary: totalSalary,
        grossEOS: Number(grossEOS.toFixed(2)),
        netEOS: Number(netEOS.toFixed(2)),
        entitlementRatio: Number(entitlementRatio.toFixed(2)),
        leaveCompensation: Number(leaveCompensation.toFixed(2)),
        leaveBalanceDays: Number(leaveBalanceDays.toFixed(2)), // Dynamic data
        leaveDeductions: Number(leaveDeductions.toFixed(2)),
        otherDeductions: Number(otherDeductions.toFixed(2)),
        totalDeductions: Number(deductions.toFixed(2)),
        finalPayable: Number(finalPayable.toFixed(2)),
        terminationType: employee.terminationType,
        isActive,
      });

      // Update totals
      totalGrossEOS += grossEOS;
      totalNetEOS += netEOS;
      totalLeaveCompensation += leaveCompensation;
      totalLeaveDeductions += leaveDeductions;
      totalOtherDeductions += otherDeductions;
      totalDeductions += deductions;
      totalFinalPayable += finalPayable;
      totalServiceYears += serviceYears;

      // Update branch breakdown
      const branchKey = employee.branch || 'غير محدد';
      if (!branchMap.has(branchKey)) {
        branchMap.set(branchKey, { count: 0, total: 0, totalLeave: 0 });
      }
      const branchData = branchMap.get(branchKey)!;
      branchData.count++;
      branchData.total += finalPayable;
      branchData.totalLeave += leaveCompensation;

      // Update job title breakdown
      const jobTitleKey = employee.jobTitle || 'غير محدد';
      if (!jobTitleMap.has(jobTitleKey)) {
        jobTitleMap.set(jobTitleKey, { count: 0, total: 0, totalLeave: 0 });
      }
      const jobTitleData = jobTitleMap.get(jobTitleKey)!;
      jobTitleData.count++;
      jobTitleData.total += finalPayable;
      jobTitleData.totalLeave += leaveCompensation;

      // Update department breakdown
      const departmentKey = employee.department || 'غير محدد';
      if (!departmentMap.has(departmentKey)) {
        departmentMap.set(departmentKey, { count: 0, total: 0, totalLeave: 0 });
      }
      const departmentData = departmentMap.get(departmentKey)!;
      departmentData.count++;
      departmentData.total += finalPayable;
      departmentData.totalLeave += leaveCompensation;

      // Update classification breakdown
      const classificationKey = employee.classification || 'غير محدد';
      if (!classificationMap.has(classificationKey)) {
        classificationMap.set(classificationKey, { count: 0, total: 0, totalLeave: 0 });
      }
      const classificationData = classificationMap.get(classificationKey)!;
      classificationData.count++;
      classificationData.total += finalPayable;
      classificationData.totalLeave += leaveCompensation;
    }

    // Build response
    return {
      summary: {
        totalEmployees: employees.length,
        totalActiveEmployees: activeCount,
        totalTerminatedEmployees: terminatedCount,
        totalGrossEOS: Number(totalGrossEOS.toFixed(2)),
        totalNetEOS: Number(totalNetEOS.toFixed(2)),
        totalLeaveCompensation: Number(totalLeaveCompensation.toFixed(2)),
        totalLeaveDeductions: Number(totalLeaveDeductions.toFixed(2)),
        totalOtherDeductions: Number(totalOtherDeductions.toFixed(2)),
        totalDeductions: Number(totalDeductions.toFixed(2)),
        totalFinalPayable: Number(totalFinalPayable.toFixed(2)),
        averageServiceYears:
          employees.length > 0
            ? Number((totalServiceYears / employees.length).toFixed(2))
            : 0,
      },
      employees: employeeEntitlements,
      branchBreakdown: Array.from(branchMap.entries()).map(
        ([branch, data]) => ({
          branch,
          employeeCount: data.count,
          totalEntitlements: Number(data.total.toFixed(2)),
          totalLeaveCompensation: Number(data.totalLeave.toFixed(2)),
        }),
      ),
      jobTitleBreakdown: Array.from(jobTitleMap.entries()).map(
        ([jobTitle, data]) => ({
          jobTitle,
          employeeCount: data.count,
          totalEntitlements: Number(data.total.toFixed(2)),
          totalLeaveCompensation: Number(data.totalLeave.toFixed(2)),
        }),
      ),
      departmentBreakdown: Array.from(departmentMap.entries()).map(
        ([department, data]) => ({
          department,
          employeeCount: data.count,
          totalEntitlements: Number(data.total.toFixed(2)),
          totalLeaveCompensation: Number(data.totalLeave.toFixed(2)),
        }),
      ),
      classificationBreakdown: Array.from(classificationMap.entries()).map(
        ([classification, data]) => ({
          classification,
          employeeCount: data.count,
          totalEntitlements: Number(data.total.toFixed(2)),
          totalLeaveCompensation: Number(data.totalLeave.toFixed(2)),
        }),
      ),
      filters: {
        companyId: query.companyId,
        fiscalYearEnd: query.fiscalYearEnd,
        branch: query.branch,
        jobTitle: query.jobTitle,
        department: query.department,
        classification: query.classification,
        status: query.status,
      },
    };
  }

  /**
   * Preview settlement calculation for an employee at a given end date
   */
  async getSettlementPreview(
    employeeId: string,
    endDate: string,
    terminationType: string,
  ) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { deductions: true, leaveBalances: true },
    });

    if (!employee) throw new Error('Employee not found');

    const start = new Date(employee.hireDate);
    const end = new Date(endDate);
    const durationInDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    const serviceYears = durationInDays / 365.25;

    const basicSalary = Number(employee.basicSalary);
    const totalSalary = Number(employee.totalSalary);

    // Gross EOS
    let grossEOS = 0;
    const firstPeriodYears = Math.min(serviceYears, 5);
    grossEOS += firstPeriodYears * 0.5 * basicSalary;
    if (serviceYears > 5) {
      grossEOS += (serviceYears - 5) * 1.0 * basicSalary;
    }

    // Entitlement ratio
    let entitlementRatio = 1.0;
    if (terminationType === 'RESIGNATION') {
      if (serviceYears < 2) entitlementRatio = 0;
      else if (serviceYears < 5) entitlementRatio = 1 / 3;
      else if (serviceYears < 10) entitlementRatio = 2 / 3;
      else entitlementRatio = 1.0;
    }

    const netEOS = grossEOS * entitlementRatio;

    // Leave balance
    const storedBalance = employee.leaveBalances[0];
    const leaveBalanceDays = storedBalance ? Number(storedBalance.calculatedRemainingDays) : 0;
    const dailyWage = totalSalary / 30;
    const leaveValue = Math.max(0, leaveBalanceDays) * dailyWage;

    // Deductions
    const totalDeductions = employee.deductions
      .filter((d) => d.status !== 'CANCELLED')
      .reduce((sum, d) => sum + Number(d.amount), 0);

    const finalPayable = netEOS + leaveValue - totalDeductions;

    return {
      employeeId: employee.id,
      fullName: employee.fullName,
      employeeNumber: employee.employeeNumber,
      hireDate: employee.hireDate.toISOString(),
      endDate,
      serviceYears: Number(serviceYears.toFixed(2)),
      basicSalary,
      totalSalary,
      grossEOS: Number(grossEOS.toFixed(2)),
      entitlementRatio: Number(entitlementRatio.toFixed(2)),
      netEOS: Number(netEOS.toFixed(2)),
      leaveBalanceDays: Number(leaveBalanceDays.toFixed(2)),
      leaveValue: Number(leaveValue.toFixed(2)),
      totalDeductions: Number(totalDeductions.toFixed(2)),
      finalPayable: Number(finalPayable.toFixed(2)),
      terminationType,
    };
  }

  /**
   * Execute employee termination: update employee record + save settlement
   * Supports additional deductions and bonuses for manual adjustments
   */
  async terminateEmployee(data: {
    employeeId: string;
    endDate: string;
    terminationType: string;
    notes?: string;
    extraDeductions?: number;
    extraBonuses?: number;
  }) {
    const preview = await this.getSettlementPreview(
      data.employeeId,
      data.endDate,
      data.terminationType,
    );

    const extraDeductions = Number(data.extraDeductions || 0);
    const extraBonuses = Number(data.extraBonuses || 0);
    const adjustedFinalPayable = preview.finalPayable - extraDeductions + extraBonuses;
    const adjustedTotalDeductions = preview.totalDeductions + extraDeductions;

    const noteParts: string[] = [];
    if (data.notes) noteParts.push(data.notes);
    if (extraDeductions > 0) noteParts.push(`خصومات إضافية: ${extraDeductions}`);
    if (extraBonuses > 0) noteParts.push(`مكافآت إضافية: ${extraBonuses}`);

    // Save settlement record
    await this.prisma.settlementRecord.create({
      data: {
        employeeId: data.employeeId,
        settlementDate: new Date(data.endDate),
        grossEOS: preview.grossEOS,
        netEOS: preview.netEOS,
        leaveBalanceDays: preview.leaveBalanceDays,
        leaveValue: preview.leaveValue,
        totalDeductions: adjustedTotalDeductions,
        finalPayable: adjustedFinalPayable,
        terminationType: data.terminationType,
        serviceYears: preview.serviceYears,
        basicSalary: preview.basicSalary,
        totalSalary: preview.totalSalary,
        notes: noteParts.join(' | ') || null,
      },
    });

    // Update employee record
    await this.prisma.employee.update({
      where: { id: data.employeeId },
      data: {
        endDate: new Date(data.endDate),
        terminationType: data.terminationType as any,
        status: 'terminated',
      },
    });

    return {
      success: true,
      settlement: {
        ...preview,
        extraDeductions,
        extraBonuses,
        adjustedFinalPayable,
      },
    };
  }

  /**
   * Reactivate a terminated employee — undo the termination
   */
  async reactivateEmployee(employeeId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });
    if (!employee) throw new Error('Employee not found');
    if (employee.status === 'active') {
      throw new Error('Employee is already active');
    }

    // Remove the latest settlement record
    const latestSettlement = await this.prisma.settlementRecord.findFirst({
      where: { employeeId },
      orderBy: { createdAt: 'desc' },
    });
    if (latestSettlement) {
      await this.prisma.settlementRecord.delete({
        where: { id: latestSettlement.id },
      });
    }

    // Reactivate employee
    await this.prisma.employee.update({
      where: { id: employeeId },
      data: {
        endDate: null,
        terminationType: null,
        status: 'active',
      },
    });

    return { success: true, message: 'تم إعادة تنشيط الموظف بنجاح' };
  }

  /**
   * Get all settlement records
   */
  async getSettlements() {
    return this.prisma.settlementRecord.findMany({
      include: { employee: { select: { fullName: true, employeeNumber: true, companyId: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
