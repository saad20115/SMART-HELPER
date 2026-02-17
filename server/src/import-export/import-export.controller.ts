import {
    Controller,
    Post,
    Get,
    Body,
    Param,
    UploadedFile,
    UseInterceptors,
    Res,
    Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { ImportExportService, ImportSummary } from './import-export.service';
import { ExportEmployeesDto } from './dto/export-employees.dto';
import { FileFormat } from '@prisma/client';

@Controller('import-export')
export class ImportExportController {
    constructor(private readonly importExportService: ImportExportService) { }

    @Post('employees/import')
    @UseInterceptors(FileInterceptor('file'))
    async importEmployees(
        @UploadedFile() file: Express.Multer.File,
        @Body('companyId') companyId: string,
        @Body('userId') userId: string,
    ): Promise<{ success: boolean; data?: ImportSummary; message?: string }> {
        console.log('Import request received');
        console.log('CompanyId:', companyId);
        console.log('UserId:', userId);
        console.log('File:', file ? `Present (${file.size} bytes)` : 'Missing');

        try {
            if (!file) {
                return { success: false, message: 'No file uploaded' };
            }

            const result = await this.importExportService.importEmployees(
                file,
                companyId,
                userId,
            );

            return {
                success: true,
                data: result,
            };
        } catch (error) {
            console.error('Import error in controller:', error);
            return {
                success: false,
                message: error.message || 'Failed to import employees due to an internal error.',
            };
        }
    }

    @Post('employees/export')
    async exportEmployees(
        @Body() exportDto: ExportEmployeesDto,
        @Res() res: Response,
    ) {
        const buffer = await this.importExportService.exportEmployees(
            exportDto.companyId,
            exportDto.format,
            exportDto.userId,
            {
                branch: exportDto.branch,
                jobTitle: exportDto.jobTitle,
            },
        );

        const timestamp = new Date().toISOString().split('T')[0];
        let filename = `employees_${timestamp}`;
        let contentType = 'application/octet-stream';

        if (exportDto.format === FileFormat.XLSX) {
            filename += '.xlsx';
            contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        } else if (exportDto.format === FileFormat.CSV) {
            filename += '.csv';
            contentType = 'text/csv';
        } else if (exportDto.format === FileFormat.JSON) {
            filename += '.json';
            contentType = 'application/json';
        }

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(buffer);
    }

    @Get('logs/import')
    async getImportLogs(
        @Query('companyId') companyId: string,
        @Query('skip') skip?: string,
        @Query('take') take?: string,
    ) {
        return this.importExportService.getImportLogs(
            companyId,
            skip ? parseInt(skip) : 0,
            take ? parseInt(take) : 10,
        );
    }

    @Get('logs/export')
    async getExportLogs(
        @Query('companyId') companyId: string,
        @Query('skip') skip?: string,
        @Query('take') take?: string,
    ) {
        return this.importExportService.getExportLogs(
            companyId,
            skip ? parseInt(skip) : 0,
            take ? parseInt(take) : 10,
        );
    }

    @Get('employees/template')
    async getEmployeeTemplate(@Res() res: Response) {
        const buffer = await this.importExportService.generateEmployeeTemplate();
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        );
        res.setHeader(
            'Content-Disposition',
            'attachment; filename="employee_template.xlsx"',
        );
        res.send(buffer);
    }

    @Get('logs/import/:id/errors')
    async getImportErrors(@Param('id') importLogId: string) {
        return this.importExportService.getImportErrors(importLogId);
    }
}
