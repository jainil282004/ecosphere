import { Injectable, Logger } from '@nestjs/common';
import * as path from 'node:path';

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);

  /**
   * Extracts text from a document buffer based on its mime type.
   * Note: This is an OCR-ready architecture interface. For production,
   * integrate with Azure Document Intelligence or Google Cloud Vision API.
   */
  async extractText(buffer: Buffer, originalFilename: string, mimeType: string): Promise<string> {
    const ext = path.extname(originalFilename).toLowerCase();
    
    // Natively handle text-based formats
    if (ext === '.txt' || ext === '.csv' || ext === '.json' || ext === '.md' || mimeType.startsWith('text/')) {
      return buffer.toString('utf-8');
    }

    // Mock OCR extraction for PDFs and Images for the scope of this hackathon
    if (ext === '.pdf' || mimeType === 'application/pdf') {
      this.logger.log(`Mocking PDF OCR extraction for ${originalFilename}`);
      return this.mockPdfOcr(originalFilename);
    }

    if (mimeType.startsWith('image/')) {
      this.logger.log(`Mocking Image OCR extraction for ${originalFilename}`);
      return this.mockImageOcr(originalFilename);
    }

    this.logger.warn(`Unsupported file format for OCR: ${ext} (${mimeType})`);
    return '';
  }

  private mockPdfOcr(filename: string): string {
    return `[Mock PDF Extracted Text]
Document Name: ${filename}
This document contains enterprise ESG data regarding emissions, supply chain audits, and compliance records.
Extracted keywords: sustainability, scope 2, compliance, energy audit.`;
  }

  private mockImageOcr(filename: string): string {
    return `[Mock Image Extracted Text]
Image Name: ${filename}
Invoice or receipt details containing utility consumption metrics. Total: $5,240.00.`;
  }
}
