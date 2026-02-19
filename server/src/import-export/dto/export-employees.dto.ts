import { IsString, IsEnum, IsOptional } from 'class-validator';
import { FileFormat } from '@prisma/client';

export class ExportEmployeesDto {
  @IsString()
  companyId: string;

  @IsEnum(FileFormat)
  format: FileFormat;

  @IsOptional()
  @IsString()
  branch?: string;

  @IsOptional()
  @IsString()
  @IsOptional()
  @IsString()
  jobTitle?: string;

  @IsString()
  userId: string;
}
