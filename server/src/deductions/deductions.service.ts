import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DeductionStatus, DeductionType, Prisma } from '@prisma/client';

@Injectable()
export class DeductionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: {
    employeeId?: string;
    status?: DeductionStatus;
    type?: DeductionType;
  }) {
    const where: Prisma.DeductionWhereInput = {};

    if (params.employeeId) where.employeeId = params.employeeId;
    if (params.status) where.status = params.status;
    if (params.type) where.type = params.type;

    return this.prisma.deduction.findMany({
      where,
      include: {
        employee: {
          select: {
            fullName: true,
            employeeNumber: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });
  }

  async create(data: {
    employeeId: string;
    type: DeductionType;
    amount: number;
    date?: string;
    status?: DeductionStatus;
    description?: string;
    notes?: string;
  }) {
    const { employeeId, type, amount, date, status, description, notes } = data;

    return this.prisma.deduction.create({
      data: {
        employeeId,
        type,
        amount: Number(amount),
        date: date ? new Date(date) : new Date(),
        status: status || DeductionStatus.PENDING,
        description,
        notes,
      },
    });
  }

  async update(
    id: string,
    data: Partial<{
      type: DeductionType;
      amount: number;
      date: string;
      status: DeductionStatus;
      description: string;
      notes: string;
    }>,
  ) {
    const deduction = await this.prisma.deduction.findUnique({ where: { id } });
    if (!deduction) throw new NotFoundException('Deduction not found');

    return this.prisma.deduction.update({
      where: { id },
      data: {
        ...data,
        amount: data.amount ? Number(data.amount) : undefined,
        date: data.date ? new Date(data.date) : undefined,
      },
    });
  }

  async delete(id: string) {
    return this.prisma.deduction.delete({ where: { id } });
  }
}
