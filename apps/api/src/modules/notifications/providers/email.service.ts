import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService) {}

  /**
   * Skeleton method for sending emails.
   * In a real implementation, this would use Nodemailer, SendGrid, AWS SES, etc.
   */
  async sendEmail(to: string, subject: string, body: string) {
    this.logger.debug(`[MOCK EMAIL] To: ${to} | Subject: ${subject}`);
    this.logger.debug(`[MOCK EMAIL BODY]\n${body}`);
    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 500));
    return true;
  }
}
