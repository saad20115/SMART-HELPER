import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { DeductionsService } from './deductions.service';
import { DeductionStatus, DeductionType } from '@prisma/client';

@Controller('deductions')
export class DeductionsController {
  constructor(private readonly deductionsService: DeductionsService) {}

  @Get()
  async getAll(
    @Query('employeeId') employeeId?: string,
    @Query('status') status?: DeductionStatus,
    @Query('type') type?: DeductionType,
  ) {
    return this.deductionsService.findAll({ employeeId, status, type });
  }

  @Post()
  async create(@Body() data: any) {
    return this.deductionsService.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    return this.deductionsService.update(id, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.deductionsService.delete(id);
  }
}
