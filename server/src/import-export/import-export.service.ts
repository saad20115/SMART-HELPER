import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FileFormat, ImportStatus, Prisma } from '@prisma/client';
import * as XLSX from 'xlsx';
import { CreateEmployeeDto } from '../employees/dto/create-employee.dto';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { parse, isValid } from 'date-fns';

export interface ImportSummary {
  totalRows: number;
  successRows: number;
  failedRows: number;
  importLogId: string;
  errors: Array<{ row: number; field?: string; message: string }>;
}

@Injectable()
export class ImportExportService {
  private readonly logger = new Logger(ImportExportService.name);

  constructor(private prisma: PrismaService) {}

  async importEmployees(
    file: Express.Multer.File,
    companyId: string,
    userId: string,
  ): Promise<ImportSummary> {
    if (!file || !file.buffer) {
      throw new Error('File is empty or missing');
    }

    if (!companyId) {
      throw new Error('Company ID is required');
    }

    this.logger.log(
      `Starting import for company ${companyId}, file: ${file.originalname}`,
    );

    // Parse the Excel/CSV file
    let data: any[] = [];
    try {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      data = XLSX.utils.sheet_to_json(worksheet);

      // Filter out completely empty rows
      data = data.filter((row) => {
        return Object.values(row).some(
          (val) =>
            val !== null &&
            val !== undefined &&
            String(val).trim() !== '' &&
            String(val) !== '[object Object]',
        );
      });
      this.logger.log(`Parsed ${data.length} data rows from file`);
    } catch (error) {
      this.logger.error('Error parsing file:', error);
      throw new Error(
        'Failed to parse file. Please ensure it is a valid Excel or CSV file.',
      );
    }

    // Create import log
    const importLog = await this.prisma.importLog.create({
      data: {
        companyId,
        fileName: file.originalname,
        totalRows: data.length,
        successRows: 0,
        failedRows: 0,
        status: ImportStatus.PROCESSING,
        createdBy: userId || 'system',
      },
    });

    const finalErrors: Array<{ row: number; field?: string; message: string }> =
      [];
    const importErrorsToCreate: Prisma.ImportErrorCreateManyInput[] = [];
    let successCount = 0;
    let failedCount = 0;

    try {
      // 1. Prepare and Validate Data in Batches
      const batchSize = 500;
      const readyToInsertEmployees: Prisma.EmployeeCreateManyInput[] = [];
      const employeeDataMap = new Map<string, any>();

      // Pre-fetch all IDs to check duplicates efficiently
      const nationalIdsToCheck = data
        .map((row) =>
          String(row['رقم الهوية'] || row['National ID'] || '').trim(),
        )
        .filter((id) => id !== '');
      const empNumsToCheck = data
        .map((row) =>
          String(row['رقم الموظف'] || row['Employee Number'] || '').trim(),
        )
        .filter((num) => num !== '');

      const existingNationalIds = new Set<string>();
      const existingEmpNums = new Set<string>();

      if (nationalIdsToCheck.length > 0 || empNumsToCheck.length > 0) {
        const existing = await this.prisma.employee.findMany({
          where: {
            companyId,
            OR: [
              { nationalId: { in: nationalIdsToCheck } },
              { employeeNumber: { in: empNumsToCheck } },
            ],
          },
          select: { nationalId: true, employeeNumber: true },
        });
        existing.forEach((e) => {
          if (e.nationalId) existingNationalIds.add(e.nationalId);
          if (e.employeeNumber) existingEmpNums.add(e.employeeNumber);
        });
      }

      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        this.logger.log(
          `Processing batch ${i / batchSize + 1} (${batch.length} rows)`,
        );

        for (let j = 0; j < batch.length; j++) {
          const row = batch[j];
          const rowNumber = i + j + 2;

          // Mapping
          const rawEmpData = {
            companyId,
            employeeNumber: String(
              row['رقم الموظف'] || row['Employee Number'] || '',
            ).trim(),
            fullName: String(
              row['الاسم الكامل'] || row['Full Name'] || '',
            ).trim(),
            nationalId: String(
              row['رقم الهوية'] || row['National ID'] || '',
            ).trim(),
            jobTitle: String(
              row['المسمى الوظيفي'] || row['Job Title'] || '',
            ).trim(),
            branch: row['الفرع'] || row['Branch'],
            basicSalary: parseFloat(
              String(row['الراتب الأساسي'] || row['Basic Salary'] || '0'),
            ),
            housingAllowance: parseFloat(
              String(row['بدل السكن'] || row['Housing Allowance'] || '0'),
            ),
            transportAllowance: parseFloat(
              String(row['بدل النقل'] || row['Transport Allowance'] || '0'),
            ),
            otherAllowances: parseFloat(
              String(row['بدلات أخرى'] || row['Other Allowances'] || '0'),
            ),
            hireDate: this.parseDate(row['تاريخ التعيين'] || row['Hire Date']),
            endDate:
              row['تاريخ الانتهاء'] || row['End Date']
                ? this.parseDate(row['تاريخ الانتهاء'] || row['End Date'])
                : null,
            terminationType: row['نوع الانتهاء'] || row['Termination Type'],
            vacationBalance: parseFloat(
              String(
                row['رصيد الإجازات'] ||
                  row['Vacation Balance'] ||
                  row['رصيد الاجازات'] ||
                  '0',
              ),
            ),
            status: 'active',
          };

          // Basic Validation (avoiding slow class-validator for every single row if possible, but keeping it for completeness)
          const empDto = plainToClass(CreateEmployeeDto, rawEmpData);
          const validationErrors = await validate(empDto);

          if (validationErrors.length > 0) {
            const msg = validationErrors
              .map((err) => Object.values(err.constraints || {}).join(', '))
              .join('; ');
            finalErrors.push({ row: rowNumber, message: msg });
            importErrorsToCreate.push({
              importLogId: importLog.id,
              rowNumber,
              errorMessage: msg,
            });
            failedCount++;
            continue;
          }

          // Duplicate Check
          if (
            existingNationalIds.has(rawEmpData.nationalId) ||
            existingEmpNums.has(rawEmpData.employeeNumber)
          ) {
            const msg = 'موظف موجود مسبقاً / Duplicate employee';
            finalErrors.push({ row: rowNumber, message: msg });
            importErrorsToCreate.push({
              importLogId: importLog.id,
              rowNumber,
              errorMessage: msg,
            });
            failedCount++;
            continue;
          }

          if (!rawEmpData.hireDate) {
            const msg = 'تاريخ التعيين غير صالح / Invalid hire date';
            finalErrors.push({ row: rowNumber, message: msg });
            importErrorsToCreate.push({
              importLogId: importLog.id,
              rowNumber,
              errorMessage: msg,
            });
            failedCount++;
            continue;
          }

          const totalSalary =
            rawEmpData.basicSalary +
            rawEmpData.housingAllowance +
            rawEmpData.transportAllowance +
            rawEmpData.otherAllowances;

          readyToInsertEmployees.push({
            companyId: rawEmpData.companyId,
            employeeNumber: rawEmpData.employeeNumber,
            fullName: rawEmpData.fullName,
            nationalId: rawEmpData.nationalId,
            jobTitle: rawEmpData.jobTitle,
            branch: rawEmpData.branch,
            basicSalary: rawEmpData.basicSalary,
            housingAllowance: rawEmpData.housingAllowance,
            transportAllowance: rawEmpData.transportAllowance,
            otherAllowances: rawEmpData.otherAllowances,
            totalSalary: totalSalary,
            hireDate: new Date(rawEmpData.hireDate),
            endDate: rawEmpData.endDate ? new Date(rawEmpData.endDate) : null,
            status: 'active',
          });

          if (rawEmpData.vacationBalance !== 0) {
            employeeDataMap.set(rawEmpData.employeeNumber, rawEmpData);
          }
        }

        // Insert errors in batches too
        if (importErrorsToCreate.length >= 100) {
          await this.prisma.importError.createMany({
            data: importErrorsToCreate.splice(0, importErrorsToCreate.length),
          });
        }
      }

      // Final write for remaining errors
      if (importErrorsToCreate.length > 0) {
        await this.prisma.importError.createMany({
          data: importErrorsToCreate,
        });
      }

      // 4. Bulk Insert Employees in Chunks
      if (readyToInsertEmployees.length > 0) {
        this.logger.log(
          `Inserting ${readyToInsertEmployees.length} employees...`,
        );
        for (let i = 0; i < readyToInsertEmployees.length; i += batchSize) {
          const chunk = readyToInsertEmployees.slice(i, i + batchSize);
          await this.prisma.employee.createMany({
            data: chunk,
            skipDuplicates: true,
          });
        }

        // 5. Build related records
        const empNums = Array.from(employeeDataMap.keys());
        const createdEmployees = await this.prisma.employee.findMany({
          where: { companyId, employeeNumber: { in: empNums } },
          select: { id: true, employeeNumber: true, totalSalary: true },
        });

        const balancesToInsert: Prisma.LeaveBalanceCreateManyInput[] = [];
        for (const emp of createdEmployees) {
          const rowData = employeeDataMap.get(emp.employeeNumber);
          if (rowData) {
            const vBalance = rowData.vacationBalance;
            const tSalary = Number(emp.totalSalary);
            const lValue = vBalance * (tSalary / 30);

            balancesToInsert.push({
              employeeId: emp.id,
              annualEntitledDays: 21,
              annualUsedDays: 0,
              calculatedRemainingDays: vBalance,
              leaveValue: lValue,
            });
          }
        }

        if (balancesToInsert.length > 0) {
          this.logger.log(
            `Inserting ${balancesToInsert.length} leave balances...`,
          );
          for (let i = 0; i < balancesToInsert.length; i += batchSize) {
            const chunk = balancesToInsert.slice(i, i + batchSize);
            await this.prisma.leaveBalance.createMany({ data: chunk });
          }

          const createdBalances = await this.prisma.leaveBalance.findMany({
            where: { employeeId: { in: createdEmployees.map((e) => e.id) } },
            select: {
              id: true,
              employeeId: true,
              calculatedRemainingDays: true,
            },
          });

          const transactions: Prisma.LeaveTransactionCreateManyInput[] =
            createdBalances.map((b) => ({
              employeeId: b.employeeId,
              leaveBalanceId: b.id,
              type: 'ADJUSTMENT',
              days: b.calculatedRemainingDays,
              reason: 'رصيد ابتدائي عند الاستيراد',
              performedBy: 'system',
            }));

          for (let i = 0; i < transactions.length; i += batchSize) {
            const chunk = transactions.slice(i, i + batchSize);
            await this.prisma.leaveTransaction.createMany({ data: chunk });
          }
        }
        successCount = createdEmployees.length;
      }
    } catch (error) {
      this.logger.error('Critical error during import:', error);
      await this.prisma.importLog.update({
        where: { id: importLog.id },
        data: {
          status: ImportStatus.FAILED,
          failedRows: data.length,
          successRows: 0,
        },
      });
      throw error;
    }

    // Update import log
    await this.prisma.importLog.update({
      where: { id: importLog.id },
      data: {
        successRows: successCount,
        failedRows: failedCount,
        status:
          failedCount === data.length
            ? ImportStatus.FAILED
            : ImportStatus.COMPLETED,
      },
    });

    return {
      totalRows: data.length,
      successRows: successCount,
      failedRows: failedCount,
      importLogId: importLog.id,
      errors: finalErrors,
    };
  }

  async exportEmployees(
    companyId: string,
    format: FileFormat,
    userId: string,
    filters?: { branch?: string; jobTitle?: string },
  ): Promise<Buffer> {
    const employees = await this.prisma.employee.findMany({
      where: {
        companyId,
        ...(filters?.branch && { branch: filters.branch }),
        ...(filters?.jobTitle && { jobTitle: filters.jobTitle }),
      },
      orderBy: { createdAt: 'desc' },
    });

    await this.prisma.exportLog.create({
      data: {
        companyId,
        exportType: 'EMPLOYEES',
        fileFormat: format,
        generatedBy: userId,
      },
    });

    const exportData = employees.map((emp) => ({
      'رقم الموظف': emp.employeeNumber,
      'الاسم الكامل': emp.fullName,
      'رقم الهوية': emp.nationalId,
      'المسمى الوظيفي': emp.jobTitle,
      الفرع: emp.branch || '',
      'الراتب الأساسي': emp.basicSalary.toString(),
      'بدل السكن': emp.housingAllowance.toString(),
      'بدل النقل': emp.transportAllowance.toString(),
      'بدلات أخرى': emp.otherAllowances.toString(),
      'إجمالي الراتب': emp.totalSalary.toString(),
      'تاريخ التعيين': emp.hireDate.toISOString().split('T')[0],
      'تاريخ الانتهاء': emp.endDate
        ? emp.endDate.toISOString().split('T')[0]
        : '',
      'نوع الانتهاء': emp.terminationType || '',
    }));

    if (format === FileFormat.JSON) {
      return Buffer.from(JSON.stringify(exportData, null, 2));
    } else if (format === FileFormat.XLSX || format === FileFormat.CSV) {
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees');

      return XLSX.write(workbook, {
        type: 'buffer',
        bookType: format === FileFormat.CSV ? 'csv' : 'xlsx',
      }) as Buffer;
    }

    throw new Error('Unsupported format');
  }

  async getImportLogs(companyId: string, skip = 0, take = 10) {
    return this.prisma.importLog.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        importErrors: {
          take: 5,
        },
      },
    });
  }

  async getExportLogs(companyId: string, skip = 0, take = 10) {
    return this.prisma.exportLog.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  async generateEmployeeTemplate(): Promise<Buffer> {
    const headers = [
      'رقم الموظف',
      'الاسم الكامل',
      'رقم الهوية',
      'المسمى الوظيفي',
      'الفرع',
      'الراتب الأساسي',
      'بدل السكن',
      'بدل النقل',
      'بدلات أخرى',
      'تاريخ التعيين',
    ];

    const worksheet = XLSX.utils.aoa_to_sheet([headers]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
    worksheet['!cols'] = headers.map(() => ({ wch: 20 }));

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }

  async getImportErrors(importLogId: string) {
    return this.prisma.importError.findMany({
      where: { importLogId },
      orderBy: { rowNumber: 'asc' },
    });
  }

  private parseDate(value: any): string | undefined {
    if (!value) return undefined;

    if (typeof value === 'number') {
      try {
        const date = XLSX.SSF.parse_date_code(value);
        const jsDate = new Date(date.y, date.m - 1, date.d);
        if (!isNaN(jsDate.getTime())) {
          return jsDate.toISOString();
        }
      } catch (e) {
        console.warn('Failed to parse Excel date code:', value);
      }
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return undefined;

      // Fast path for ISO-like strings
      if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
        const d = new Date(trimmed);
        if (!isNaN(d.getTime())) return d.toISOString();
      }

      const formats = [
        'dd/MM/yyyy',
        'dd-MM-yyyy',
        'dd.MM.yyyy',
        'yyyy/MM/dd',
        'yyyy-MM-dd',
        'MM/dd/yyyy',
        'd/M/yyyy',
        'M/d/yyyy',
      ];

      for (const fmt of formats) {
        try {
          const parsedDate = parse(trimmed, fmt, new Date());
          if (isValid(parsedDate)) {
            if (parsedDate.getFullYear() > 1900) {
              return parsedDate.toISOString();
            }
          }
        } catch (e) {}
      }

      const normalized = trimmed.replace(/[٠-٩]/g, (d) =>
        '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString(),
      );
      if (normalized !== trimmed) {
        for (const fmt of formats) {
          try {
            const parsedDate = parse(normalized, fmt, new Date());
            if (isValid(parsedDate)) {
              if (parsedDate.getFullYear() > 1900) {
                return parsedDate.toISOString();
              }
            }
          } catch (e) {}
        }
      }
    }

    return undefined;
  }
}
