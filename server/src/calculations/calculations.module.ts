import { Module } from '@nestjs/common';
import { EosController } from './eos.controller';
import { EosCalculationService } from './eos.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EosController],
  providers: [EosCalculationService],
})
export class CalculationsModule {}
