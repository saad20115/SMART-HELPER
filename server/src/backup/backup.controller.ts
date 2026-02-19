import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Res,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { BackupService } from './backup.service';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';

@Controller('backup')
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Post()
  async createBackup() {
    return await this.backupService.createBackup();
  }

  @Get()
  async getBackups() {
    return await this.backupService.getBackups();
  }

  @Delete(':filename')
  async deleteBackup(@Param('filename') filename: string) {
    return await this.backupService.deleteBackup(filename);
  }

  @Post('restore/:filename')
  async restoreBackup(@Param('filename') filename: string) {
    return await this.backupService.restoreBackup(filename);
  }

  @Get(':filename/download')
  async downloadBackup(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    const filepath = this.backupService.getBackupPath(filename);
    res.download(filepath);
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './backups',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `backup-uploaded-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (
          file.mimetype !== 'application/json' &&
          !file.originalname.endsWith('.json')
        ) {
          return cb(
            new BadRequestException('Only JSON files are allowed!'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadBackup(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    return {
      message: 'File uploaded successfully',
      filename: file.filename,
      originalName: file.originalname,
    };
  }
}
