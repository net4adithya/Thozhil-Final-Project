import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AssessmentsModule } from './assessments/assessments.module';

@Module({
  imports: [PrismaModule, AssessmentsModule],
})
export class AppModule {}
