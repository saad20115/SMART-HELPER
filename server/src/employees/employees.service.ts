import { Injectable, NotFoundException } from '@nestjs/common';
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
    const {
      vacationBalance: _vacationBalance,
      endServiceReason: _endServiceReason,
      ...prismaData
    } = createEmployeeDto;

    const totalSalary =
      Number(prismaData.basicSalary || 0) +
      Number(prismaData.housingAllowance || 0) +
      Number(prismaData.transportAllowance || 0) +
      Number(prismaData.otherAllowances || 0);

    const employee = await this.prisma.employee.create({
      data: {
        ...prismaData,
        basicSalary: Number(prismaData.basicSalary || 0),
        housingAllowance: Number(prismaData.housingAllowance || 0),
        transportAllowance: Number(prismaData.transportAllowance || 0),
        otherAllowances: Number(prismaData.otherAllowances || 0),
        totalSalary: totalSalary,
        hireDate: new Date(prismaData.hireDate),
        endDate: prismaData.endDate ? new Date(prismaData.endDate) : null,
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
          leaveValue: Number(createEmployeeDto.vacationBalance) * (totalSalary / 30),
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
    if (!currentEmployee) throw new NotFoundException('Employee not found');

    // Sanitize input
    const {
      vacationBalance: _vacationBalance,
      endServiceReason: _endServiceReason,
      ...prismaUpdateData
    } = updateEmployeeDto;

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

    const totalSalary =
      Number(basicSalary) +
      Number(housingAllowance) +
      Number(transportAllowance) +
      Number(otherAllowances);

    const data: Prisma.EmployeeUpdateInput = {
      fullName: prismaUpdateData.fullName,
      employeeNumber: prismaUpdateData.employeeNumber,
      nationalId: prismaUpdateData.nationalId,
      jobTitle: prismaUpdateData.jobTitle,
      branch: prismaUpdateData.branch,
      department: prismaUpdateData.department,
      classification: prismaUpdateData.classification,
      basicSalary: Number(basicSalary),
      housingAllowance: Number(housingAllowance),
      transportAllowance: Number(transportAllowance),
      otherAllowances: Number(otherAllowances),
      totalSalary: totalSalary,
      status: prismaUpdateData.status,
    };

    if (prismaUpdateData.hireDate) {
      data.hireDate = new Date(prismaUpdateData.hireDate);
    }
    if (prismaUpdateData.endDate) {
      data.endDate = new Date(prismaUpdateData.endDate);
    }

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
    if (!employee) return null;
    const balanceData = this.leaveService.calculateCurrentBalance(employee);

    return {
      ...employee,
      vacationBalance: balanceData.vacationBalance,
      serviceYears: balanceData.serviceYears,
    };
  }
}
