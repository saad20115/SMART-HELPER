import { Test, TestingModule } from '@nestjs/testing';
import { LeaveService } from './leave.service';
import { PrismaService } from '../prisma/prisma.service';
import { LeaveTransactionType } from '@prisma/client';

const mockPrismaService = {
    employee: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
    },
    leaveBalance: {
        create: jest.fn(),
        update: jest.fn(),
    },
    leaveTransaction: {
        create: jest.fn(),
    },
};

describe('LeaveService', () => {
    let service: LeaveService;
    let prisma: PrismaService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                LeaveService,
                { provide: PrismaService, useValue: mockPrismaService },
            ],
        }).compile();

        service = module.get<LeaveService>(LeaveService);
        prisma = module.get<PrismaService>(PrismaService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('recalculateAccruals', () => {
        it('should calculate 21 days for service < 5 years', async () => {
            const mockEmployee = {
                id: '1',
                hireDate: new Date(new Date().setFullYear(new Date().getFullYear() - 2)), // 2 years ago
                leaveBalances: [{ id: 'b1' }],
            };

            mockPrismaService.employee.findUnique.mockResolvedValue(mockEmployee);

            await service.recalculateAccruals('1');

            expect(prisma.leaveBalance.update).toHaveBeenCalledWith({
                where: { id: 'b1' },
                data: expect.objectContaining({
                    annualEntitledDays: 21,
                }),
            });
        });

        it('should calculate 30 days for service >= 5 years', async () => {
            const mockEmployee = {
                id: '1',
                hireDate: new Date(new Date().setFullYear(new Date().getFullYear() - 6)), // 6 years ago
                leaveBalances: [{ id: 'b1' }],
            };

            mockPrismaService.employee.findUnique.mockResolvedValue(mockEmployee);

            await service.recalculateAccruals('1');

            expect(prisma.leaveBalance.update).toHaveBeenCalledWith({
                where: { id: 'b1' },
                data: expect.objectContaining({
                    annualEntitledDays: 30,
                }),
            });
        });
    });

    describe('adjustBalance', () => {
        it('should correctly adjust balance and create transaction', async () => {
            const mockEmployee = {
                id: '1',
                totalSalary: 3000,
                leaveBalances: [{
                    id: 'b1',
                    calculatedRemainingDays: 10,
                    leaveValue: 1000
                }],
            };

            mockPrismaService.employee.findUnique.mockResolvedValue(mockEmployee);

            const dto = {
                employeeId: '1',
                days: 5,
                reason: 'Test',
                type: 'IsManualAdjustment' as const
            };

            await service.adjustBalance(dto, 'admin');

            expect(prisma.leaveTransaction.create).toHaveBeenCalledWith(expect.objectContaining({
                days: 5,
                type: LeaveTransactionType.ADJUSTMENT,
            }));

            // New balance should be 10 + 5 = 15
            // New Value = 15 * (3000/30) = 15 * 100 = 1500
            expect(prisma.leaveBalance.update).toHaveBeenCalledWith({
                where: { id: 'b1' },
                data: expect.objectContaining({
                    calculatedRemainingDays: 15,
                    leaveValue: 1500,
                }),
            });
        });
    });
});
