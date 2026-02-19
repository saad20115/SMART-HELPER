import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { CalculationsModule } from './calculations/calculations.module';
import { EmployeesModule } from './employees/employees.module';
import { ImportExportModule } from './import-export/import-export.module';
import { CompanyModule } from './company/company.module';
import { SettingsModule } from './settings/settings.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { LeaveModule } from './leave/leave.module';
import { DeductionsModule } from './deductions/deductions.module';
import { BackupModule } from './backup/backup.module';

@Module({
  imports: [
    PrismaModule,
    CompanyModule,
    EmployeesModule,
    SettingsModule,
    CalculationsModule,
    DashboardModule,
    ImportExportModule,
    LeaveModule,
    DeductionsModule,
    BackupModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
