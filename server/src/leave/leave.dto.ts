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
