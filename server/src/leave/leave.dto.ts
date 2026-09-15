export class AdjustLeaveBalanceDto {
  employeeId: string;
  days: number; // Positive for addition, negative for deduction
  reason: string;
  type: 'IsManualAdjustment'; // To distinguish from accruals
}

export class LeaveBalanceResponseDto {
  employeeId: string;
  employeeName: string;
  branch: string | null;
  jobTitle: string;
  hireDate: string;
  serviceYears: number;
  annualEntitledDays: number;
  annualUsedDays: number;
  calculatedRemainingDays: number;
  leaveValue: number;
  lastCalculatedAt: string;
}

export class LeaveTransactionDto {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  type: string;
  days: number;
  reason: string | null;
  performedBy: string | null;
  createdAt: string;
  balanceAfter: number | null;
}

export class EmployeeLeaveHistoryDto {
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  jobTitle: string;
  branch: string | null;
  hireDate: string;
  annualEntitledDays: number;
  annualUsedDays: number;
  calculatedRemainingDays: number;
  leaveValue: number;
  transactions: LeaveTransactionDto[];
}
