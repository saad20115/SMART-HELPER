import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { Prisma } from '@prisma/client';
import { LeaveService } from '../leave/leave.service';

@Injectable()
export class EmployeesService {
  constructor(
    private prisma: PrismaService,
    private leaveService: LeaveService,
  ) { }

  async create(createEmployeeDto: CreateEmployeeDto) {
    const { vacationBalance: _vacationBalance, endServiceReason: _endServiceReason, ...prismaData } = createEmployeeDto;

    const totalSalary =
      Number(prismaData.basicSalary) +
      Number(prismaData.housingAllowance) +
      Number(prismaData.transportAllowance) +
      Number(prismaData.otherAllowances);

    const employee = await this.prisma.employee.create({
      data: {
        ...prismaData,
        totalSalary,
        hireDate: new Date(prismaData.hireDate),
        endDate: prismaData.endDate
          ? new Date(prismaData.endDate)
          : null,
      },
      include: { leaveBalances: true },
    });

    // If vacation balance is provided, create a balance record and an adjustment transaction
    if (
      createEmployeeDto.vacationBalance !== undefined &&
      Number(createEmployeeDto.vacationBalance) !== 0
    ) {
      const balance = await this.prisma.leaveBalance.create({
        data: {
          employeeId: employee.id,
          annualEntitledDays: 21,
          annualUsedDays: 0,
          calculatedRemainingDays: Number(createEmployeeDto.vacationBalance),
          leaveValue:
            Number(createEmployeeDto.vacationBalance) * (totalSalary / 30),
        },
      });

      await this.prisma.leaveTransaction.create({
        data: {
          employeeId: employee.id,
          leaveBalanceId: balance.id,
          type: 'ADJUSTMENT',
          days: Number(createEmployeeDto.vacationBalance),
          reason: 'رصيد ابتدائي عند الإضافة',
          performedBy: 'system',
        },
      });
    }

    return this.findOne(employee.id);
  }

  async findAll() {
    const employees = await this.prisma.employee.findMany({
      include: {
        leaveBalances: true,
        leaveTransactions: true,
      },
    });

    return employees.map((emp) => this.enrichWithVacationBalance(emp));
  }

  async findOne(id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        leaveBalances: true,
        leaveTransactions: true,
        deductions: true,
      },
    });

    if (!employee) return null;
    return this.enrichWithVacationBalance(employee);
  }

  async update(id: string, updateEmployeeDto: Partial<CreateEmployeeDto>) {
    const currentEmployee = await this.prisma.employee.findUnique({
      where: { id },
    });
    if (!currentEmployee) throw new Error('Employee not found');

    // Sanitize input: remove non-model fields
    const { vacationBalance: _vacationBalance, endServiceReason: _endServiceReason, companyId: _companyId, ...prismaUpdateData } = updateEmployeeDto;
    const data: Prisma.EmployeeUpdateInput = { ...prismaUpdateData } as any;

    // Recalculate total salary if any component changes
    const basicSalary =
      updateEmployeeDto.basicSalary ?? Number(currentEmployee.basicSalary);
    const housingAllowance =
      updateEmployeeDto.housingAllowance ??
      Number(currentEmployee.housingAllowance);
    const transportAllowance =
      updateEmployeeDto.transportAllowance ??
      Number(currentEmployee.transportAllowance);
    const otherAllowances =
      updateEmployeeDto.otherAllowances ??
      Number(currentEmployee.otherAllowances);

    data.totalSalary =
      Number(basicSalary) + Number(housingAllowance) + Number(transportAllowance) + Number(otherAllowances);

    if (updateEmployeeDto.hireDate)
      data.hireDate = new Date(updateEmployeeDto.hireDate);
    if (updateEmployeeDto.endDate)
      data.endDate = new Date(updateEmployeeDto.endDate);
    if (updateEmployeeDto.status) data.status = updateEmployeeDto.status;

    const updatedEmployee = await this.prisma.employee.update({
      where: { id },
      data,
      include: { leaveBalances: true, leaveTransactions: true },
    });

    return this.enrichWithVacationBalance(updatedEmployee);
  }

  async remove(id: string) {
    return this.prisma.employee.delete({ where: { id } });
  }

  private enrichWithVacationBalance(employee: any) {
    const balanceData = this.leaveService.calculateCurrentBalance(employee);

    return {
      ...employee,
      vacationBalance: balanceData.vacationBalance,
      serviceYears: balanceData.serviceYears,
    };
  }
}
