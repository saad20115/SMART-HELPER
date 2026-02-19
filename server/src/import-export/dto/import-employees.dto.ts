import { IsString } from 'class-validator';

export class ImportEmployeesDto {
  @IsString()
  companyId: string;

  @IsString()
  userId: string; // The user performing the import
}
