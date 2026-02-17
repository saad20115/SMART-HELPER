import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import { join } from 'path';

@Injectable()
export class BackupService {
    private readonly logger = new Logger(BackupService.name);
    private readonly backupDir = join(process.cwd(), 'backups');

    constructor(private prisma: PrismaService) {
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir);
        }
    }

    async createBackup() {
        this.logger.log('Starting database backup...');

        // Define all models to backup
        // Order matters mostly for logical grouping, but for restore we need strict dependency order
        const data = {
            timestamp: new Date().toISOString(),
            companies: await this.prisma.company.findMany(),
            users: await this.prisma.user.findMany(),
            branches: await this.prisma.branch.findMany(),
            jobs: await this.prisma.job.findMany(),
            classifications: await this.prisma.classification.findMany(),
            employees: await this.prisma.employee.findMany(),
            leaveBalances: await this.prisma.leaveBalance.findMany(),
            leaveTransactions: await this.prisma.leaveTransaction.findMany(),
            deductions: await this.prisma.deduction.findMany(),
            eosCalculations: await this.prisma.eosCalculation.findMany(),
            importLogs: await this.prisma.importLog.findMany(),
            importErrors: await this.prisma.importError.findMany(),
            exportLogs: await this.prisma.exportLog.findMany(),
        };

        const filename = `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        const filepath = join(this.backupDir, filename);

        fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
        this.logger.log(`Backup created successfully: ${filename}`);

        return { filename, size: fs.statSync(filepath).size, createdAt: new Date() };
    }

    async getBackups() {
        const files = fs.readdirSync(this.backupDir).filter(f => f.endsWith('.json'));
        return files.map(file => {
            const stats = fs.statSync(join(this.backupDir, file));
            return {
                filename: file,
                size: stats.size,
                createdAt: stats.birthtime,
            };
        }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    getBackupPath(filename: string) {
        const filepath = join(this.backupDir, filename);
        if (!fs.existsSync(filepath)) {
            throw new NotFoundException('Backup file not found');
        }
        return filepath;
    }

    async deleteBackup(filename: string) {
        const filepath = this.getBackupPath(filename);
        fs.unlinkSync(filepath);
        return { message: 'Backup deleted successfully' };
    }

    async restoreBackup(filename: string) {
        this.logger.log(`Restoring backup: ${filename}...`);
        const filepath = this.getBackupPath(filename);
        const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));

        // Validate minimal structure
        if (!data.companies || !data.employees) {
            throw new BadRequestException('Invalid backup file format');
        }

        // Transaction for atomic restore
        // 1. Delete all data (Reverse dependency order to avoid FK constraint fails if we weren't using deleteMany which might cascade, 
        // but safe to be explicit)
        // Prisma deleteMany doesn't always cascade depending on schema, so explicit delete is safer.

        await this.prisma.$transaction(async (tx) => {
            this.logger.log('Clearing existing data...');
            // Start with leaf nodes (dependents)
            await tx.importError.deleteMany();
            await tx.importLog.deleteMany();
            await tx.exportLog.deleteMany();

            await tx.eosCalculation.deleteMany();
            await tx.deduction.deleteMany();
            await tx.leaveTransaction.deleteMany();
            await tx.leaveBalance.deleteMany();

            await tx.employee.deleteMany(); // Depends on Company (and implicitly Branch/Job/Class via strings, no FK)

            await tx.classification.deleteMany();
            await tx.job.deleteMany();
            await tx.branch.deleteMany();
            await tx.user.deleteMany();

            await tx.company.deleteMany(); // Root

            this.logger.log('Inserting backup data...');

            // Insert in dependency order (Roots first)
            if (data.companies?.length) await tx.company.createMany({ data: data.companies });
            if (data.users?.length) await tx.user.createMany({ data: data.users });
            if (data.branches?.length) await tx.branch.createMany({ data: data.branches });
            if (data.jobs?.length) await tx.job.createMany({ data: data.jobs });
            if (data.classifications?.length) await tx.classification.createMany({ data: data.classifications });

            if (data.employees?.length) await tx.employee.createMany({ data: data.employees });

            if (data.leaveBalances?.length) await tx.leaveBalance.createMany({ data: data.leaveBalances });
            if (data.leaveTransactions?.length) await tx.leaveTransaction.createMany({ data: data.leaveTransactions });
            if (data.deductions?.length) await tx.deduction.createMany({ data: data.deductions });
            if (data.eosCalculations?.length) await tx.eosCalculation.createMany({ data: data.eosCalculations });

            if (data.exportLogs?.length) await tx.exportLog.createMany({ data: data.exportLogs });
            if (data.importLogs?.length) await tx.importLog.createMany({ data: data.importLogs }); // Has to be before errors
            if (data.importErrors?.length) await tx.importError.createMany({ data: data.importErrors });
        });

        this.logger.log(`Restore completed successfully for ${filename}`);
        return { message: 'Restore completed successfully' };
    }
}
