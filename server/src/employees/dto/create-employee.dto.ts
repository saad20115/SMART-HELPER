import { IsString, IsDecimal, IsDateString, IsEnum, IsOptional, IsNumber, IsNotEmpty } from 'class-validator';
// import { TerminationType } from '@prisma/client';

export enum TerminationType {
    RESIGNATION = 'RESIGNATION',
    TERMINATION = 'TERMINATION',
    CONTRACT_END = 'CONTRACT_END',
}

export class CreateEmployeeDto {
    @IsString()
    companyId: string;

    @IsString()
    @IsNotEmpty()
    employeeNumber: string;

    @IsString()
    @IsNotEmpty()
    fullName: string;

    @IsString()
    @IsNotEmpty()
    nationalId: string;

    @IsString()
    jobTitle: string;

    @IsOptional()
    @IsString()
    branch?: string;

    @IsOptional()
    @IsString()
    department?: string;

    @IsOptional()
    @IsString()
    classification?: string;

    @IsNumber()
    basicSalary: number;

    @IsNumber()
    housingAllowance: number;

    @IsNumber()
    transportAllowance: number;

    @IsNumber()
    otherAllowances: number;

    @IsDateString()
    hireDate: string;

    @IsOptional()
    @IsDateString()
    endDate?: string;

    @IsOptional()
    @IsEnum(TerminationType)
    terminationType?: TerminationType;

    @IsOptional()
    @IsString()
    endServiceReason?: string; // e.g. "Article 77", "Article 80" details

    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsNumber()
    vacationBalance?: number;

    @IsOptional()
    @IsNumber()
    totalSalary?: number;
}
