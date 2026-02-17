import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FileFormat, ImportStatus } from '@prisma/client';
import * as XLSX from 'xlsx';
import { CreateEmployeeDto } from '../employees/dto/create-employee.dto';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

export interface ImportSummary {
  totalRows: number;
  successRows: number;
  failedRows: number;
  importLogId: string;
  errors: Array<{ row: number; field?: string; message: string }>;
}

@Injectable()
export class ImportExportService {
  constructor(private prisma: PrismaService) { }

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

    // Parse the Excel/CSV file carefully
    let data: any[] = [];
    try {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      data = XLSX.utils.sheet_to_json(worksheet);
    } catch (error) {
      console.error('Error parsing file:', error);
      throw new Error(
        'Failed to parse file. Please ensure it is a valid Excel or CSV file.',
      );
    }

    // Create import log
    let importLog;
    try {
      importLog = await this.prisma.importLog.create({
        data: {
          companyId,
          fileName: file.originalname,
          totalRows: data.length,
          successRows: 0,
          failedRows: 0,
          status: ImportStatus.PROCESSING,
          createdBy: userId || 'system', // Fallback if userId is missing
        },
      });
    } catch (error) {
      console.error('Error creating import log:', error);
      // Check for Prisma initialization error or connection error
      if (
        error.code === 'P1001' ||
        error.message.includes("Can't reach database server")
      ) {
        throw new Error('Database connection failed. Please try again later.');
      }
      throw new Error(
        'Failed to start import process. Database error: ' +
        (error.message || 'Unknown'),
      );
    }

    let successCount = 0;
    let failedCount = 0;
    const errors: Array<{ row: number; field?: string; message: string }> = [];

    try {
      // Process each row

      // Process each row
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowNumber = i + 2; // Excel rows start at 1, plus header row

        try {
          // Map Excel columns to DTO fields
          const employeeData: CreateEmployeeDto = plainToClass(
            CreateEmployeeDto,
            {
              companyId,
              employeeNumber: String(
                row['رقم الموظف'] || row['Employee Number'] || '',
              ),
              fullName: row['الاسم الكامل'] || row['Full Name'] || '',
              nationalId: String(row['رقم الهوية'] || row['National ID'] || ''),
              jobTitle: row['المسمى الوظيفي'] || row['Job Title'] || '',
              branch: row['الفرع'] || row['Branch'],
              basicSalary: parseFloat(
                row['الراتب الأساسي'] || row['Basic Salary'] || '0',
              ),
              housingAllowance: parseFloat(
                row['بدل السكن'] || row['Housing Allowance'] || '0',
              ),
              transportAllowance: parseFloat(
                row['بدل النقل'] || row['Transport Allowance'] || '0',
              ),
              otherAllowances: parseFloat(
                row['بدلات أخرى'] || row['Other Allowances'] || '0',
              ),
              hireDate: this.parseDate(
                row['تاريخ التعيين'] || row['Hire Date'],
              ),
              endDate: this.parseDate(row['تاريخ الانتهاء'] || row['End Date']),
              terminationType: row['نوع الانتهاء'] || row['Termination Type'],
              vacationBalance: parseFloat(
                row['رصيد الإجازات'] ||
                row['Vacation Balance'] ||
                row['رصيد الاجازات'] ||
                '0',
              ),
            },
          );

          // Validate the data
          const validationErrors = await validate(employeeData);
          if (validationErrors.length > 0) {
            const errorMessages = validationErrors
              .map((err) => Object.values(err.constraints || {}).join(', '))
              .join('; ');

            errors.push({
              row: rowNumber,
              message: errorMessages,
            });

            await this.prisma.importError.create({
              data: {
                importLogId: importLog.id,
                rowNumber,
                errorMessage: errorMessages,
              },
            });

            failedCount++;
            continue;
          }

          // Check for duplicates only on non-empty fields
          const duplicateFilters: any[] = [];
          if (
            employeeData.nationalId &&
            employeeData.nationalId.trim() !== ''
          ) {
            duplicateFilters.push({ nationalId: employeeData.nationalId });
          }
          if (
            employeeData.employeeNumber &&
            employeeData.employeeNumber.trim() !== ''
          ) {
            duplicateFilters.push({
              employeeNumber: employeeData.employeeNumber,
            });
          }

          if (duplicateFilters.length > 0) {
            const existing = await this.prisma.employee.findFirst({
              where: {
                companyId,
                OR: duplicateFilters,
              },
            });

            if (existing) {
              errors.push({
                row: rowNumber,
                message: `موظف موجود مسبقاً برقم الهوية أو رقم الموظف / Employee already exists with this National ID or Employee Number`,
              });

              await this.prisma.importError.create({
                data: {
                  importLogId: importLog.id,
                  rowNumber,
                  errorMessage: 'Duplicate employee',
                },
              });

              failedCount++;
              continue;
            }
          }

          const totalSalary =
            Number(employeeData.basicSalary || 0) +
            Number(employeeData.housingAllowance || 0) +
            Number(employeeData.transportAllowance || 0) +
            Number(employeeData.otherAllowances || 0);

          const employee = await this.prisma.employee.create({
            data: {
              ...employeeData,
              totalSalary,
              hireDate: new Date(employeeData.hireDate),
              endDate: employeeData.endDate
                ? new Date(employeeData.endDate)
                : null,
            },
          });

          if (
            employeeData.vacationBalance !== undefined &&
            Number(employeeData.vacationBalance) !== 0
          ) {
            const balance = await this.prisma.leaveBalance.create({
              data: {
                employeeId: employee.id,
                annualEntitledDays: 21,
                annualUsedDays: 0,
                calculatedRemainingDays: Number(employeeData.vacationBalance),
                leaveValue:
                  Number(employeeData.vacationBalance) * (totalSalary / 30),
              },
            });

            await this.prisma.leaveTransaction.create({
              data: {
                employeeId: employee.id,
                leaveBalanceId: balance.id,
                type: 'ADJUSTMENT',
                days: Number(employeeData.vacationBalance),
                reason: 'رصيد ابتدائي عند الاستيراد',
                performedBy: 'system',
              },
            });
          }

          successCount++;
        } catch (error) {
          errors.push({
            row: rowNumber,
            message: error.message || 'خطأ غير معروف / Unknown error',
          });

          await this.prisma.importError.create({
            data: {
              importLogId: importLog.id,
              rowNumber,
              errorMessage: error.message || 'Unknown error',
            },
          });

          failedCount++;
        }
      }
    } catch (error) {
      // If a catastrophic error occurs (like DB connection loss), mark log as FAILED
      await this.prisma.importLog.update({
        where: { id: importLog.id },
        data: {
          status: ImportStatus.FAILED,
          failedRows: data.length, // Assume all failed if we crashed
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
      errors,
    };
  }

  async exportEmployees(
    companyId: string,
    format: FileFormat,
    userId: string,
    filters?: { branch?: string; jobTitle?: string },
  ): Promise<Buffer> {
    // Query employees with optional filters
    const employees = await this.prisma.employee.findMany({
      where: {
        companyId,
        ...(filters?.branch && { branch: filters.branch }),
        ...(filters?.jobTitle && { jobTitle: filters.jobTitle }),
      },
      orderBy: { createdAt: 'desc' },
    });

    // Create export log
    await this.prisma.exportLog.create({
      data: {
        companyId,
        exportType: 'EMPLOYEES',
        fileFormat: format,
        generatedBy: userId,
      },
    });

    // Transform data for export
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

      const buffer = XLSX.write(workbook, {
        type: 'buffer',
        bookType: format === FileFormat.CSV ? 'csv' : 'xlsx',
      });

      return buffer;
    }

    throw new Error('Unsupported format');
  }

  async getImportLogs(companyId: string, skip: number = 0, take: number = 10) {
    return this.prisma.importLog.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        importErrors: {
          take: 5, // Preview first 5 errors
        },
      },
    });
  }

  async getExportLogs(companyId: string, skip: number = 0, take: number = 10) {
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

    // Set column widths for better readability
    worksheet['!cols'] = headers.map(() => ({ wch: 20 }));

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  async getImportErrors(importLogId: string) {
    return this.prisma.importError.findMany({
      where: { importLogId },
      orderBy: { rowNumber: 'asc' },
    });
  }
  private parseDate(value: any): string | undefined {
    if (!value) return undefined;

    // Handle Excel serial number
    if (typeof value === 'number') {
      const date = XLSX.SSF.parse_date_code(value);
      return new Date(date.y, date.m - 1, date.d).toISOString();
    }

    // Handle string formats
    if (typeof value === 'string') {
      const trimmedValue = value.trim();

      // Check for DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY format
      // Also supports MM/DD/YYYY if the first part is > 12
      // Regex captures: 1=PartA, 2=PartB, 3=Year
      const dateMatch = trimmedValue.match(
        /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/,
      );
      if (dateMatch) {
        const partA = parseInt(dateMatch[1]);
        const partB = parseInt(dateMatch[2]);
        const year = parseInt(dateMatch[3]);

        let day, month;

        // Assumption: DD/MM/YYYY is standard.
        // However, if PartA > 12, it must be day (so PartB is month).
        // If PartB > 12, it must be day (so PartA is month), but standard ISO is MM/DD/YYYY?
        // Let's try to be smart.

        if (partB > 12 && partA <= 12) {
          // Clearly MM/DD/YYYY (e.g. 02/15/2026)
          month = partA - 1;
          day = partB;
        } else {
          // Default to DD/MM/YYYY (e.g. 15/02/2026)
          // Or if both <= 12, ambiguous, assume DD/MM/YYYY (common in region)
          day = partA;
          month = partB - 1;
        }

        // Validate month
        if (month < 0 || month > 11) {
          // Try swapping if we didn't already
          if (partA <= 12 && partB > 12) {
            // already handled above
          } else if (partA > 12 && partB <= 12) {
            // already handled above (standard DD/MM)
          } else if (partA <= 12 && partB <= 12) {
            // Ambiguous, try swapping to see if it makes sense?
            // No, if both are <= 12, standard assumption applies.
          }
          // If still invalid, maybe just fail?
        }

        // Construct date
        const date = new Date(year, month, day);

        // Validate that the date components match (handles 31/02/2026 -> March 3rd etc if we want to be strict)
        // But Date object auto-corrects. Let's just return strict ISO.
        // Actually, let's just use the Date object but format manually to avoid timezone issues 100%

        // Re-verify strictly?
        if (
          date.getFullYear() === year &&
          date.getMonth() === month &&
          date.getDate() === day
        ) {
          const mm = (month + 1).toString().padStart(2, '0');
          const dd = day.toString().padStart(2, '0');
          return `${year}-${mm}-${dd}T00:00:00.000Z`;
        }
      }

      // Try standard Date parse as fallback (handles YYYY-MM-DD, etc.)
      const date = new Date(trimmedValue);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    }

    return undefined;
  }
}
