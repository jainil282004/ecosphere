import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { ReportExportService } from './report-export.service';
import { ReportStorageService } from './report-storage.service';
import { RepositoriesModule } from '../../database/repositories/repositories.module';

@Module({
  imports: [RepositoriesModule],
  providers: [ReportsService, ReportExportService, ReportStorageService],
  controllers: [ReportsController],
  exports: [ReportsService],
})
export class ReportsModule {}
