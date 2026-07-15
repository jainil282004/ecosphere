import { Module } from '@nestjs/common';
import { VaultController } from './vault.controller';
import { VaultService } from './vault.service';
import { VaultStorageService } from './vault-storage.service';
import { OcrService } from './ocr.service';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AiModule],
  controllers: [VaultController],
  providers: [VaultService, VaultStorageService, OcrService],
  exports: [VaultService],
})
export class VaultModule {}
