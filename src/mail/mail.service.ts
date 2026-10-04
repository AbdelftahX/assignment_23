import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  async sendConfirmationEmail(
    to: string,
    name: string,
    otp: string,
    expiresInMinutes: number,
  ): Promise<void> {
    const fromName = this.configService.get<string>('MAIL_FROM_NAME') ?? 'App';
    const fromAddress = this.configService.get<string>('MAIL_USER');

    try {
      await this.mailerService.sendMail({
        from: `"${fromName}" <${fromAddress}>`,
        to,
        subject: 'Confirm your email',
        template: 'confirm-email',
        context: { name, otp, expiresInMinutes },
      });
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${(error as Error).message}`);
      throw new InternalServerErrorException('Failed to send confirmation email');
    }
  }
}
