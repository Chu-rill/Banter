import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs/promises';
import * as handlebars from 'handlebars';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private welcomeTemplatePath: string;
  private forgetPasswordTemplatePath: string;
  private sendPasswordChangeConfirmationTemplatePath: string;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: configService.get<string>('EMAIL_PROVIDER'),
      port: Number(configService.get<string>('SERVICE_PORT')),
      secure: false,
      service: 'gmail',
      auth: {
        user: configService.get<string>('EMAIL_USER'),
        pass: configService.get<string>('EMAIL_PASS'),
      },
    });

    this.welcomeTemplatePath = path.join(
      process.cwd(),
      'src/views/welcome.hbs',
    );
    this.forgetPasswordTemplatePath = path.join(
      process.cwd(),
      'src/views/forgot-password.hbs',
    );
    this.sendPasswordChangeConfirmationTemplatePath = path.join(
      process.cwd(),
      'src/views/password-change-confirm.hbs',
    );
  }

  // Method to read the email template file based on a path
  private async readTemplateFile(templatePath: string): Promise<string> {
    try {
      return await fs.readFile(templatePath, 'utf-8');
    } catch (error) {
      throw new Error(`Error reading email template file: ${error}`);
    }
  }

  // Send an email to verify the users account
  async sendWelcomeEmail(
    email: string,
    data: { subject: string; username: string; token: string },
  ): Promise<void> {
    try {
      const verifyUrl = this.configService.get('VERIFY_URL');
      const verificationUrl = `${verifyUrl}?token=${data.token}`;
      const templateSource = await this.readTemplateFile(
        this.welcomeTemplatePath,
      );
      const emailTemplate = handlebars.compile(templateSource);

      const info = await this.transporter.sendMail({
        from: this.configService.get<string>('EMAIL_USER'),
        to: email,
        subject: data.subject,
        html: emailTemplate({
          appName: 'Banter',
          username: data.username,
          verificationLink: verificationUrl,
          title: 'Verification Email',
        }),
      });

      this.logger.log(
        `Welcome email sent successfully to ${email}. MessageId: ${info.messageId}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(
        `Failed to send welcome email to ${email}: ${errorMessage}`,
        error,
      );

      console.error(
        `Error sending email with template: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async sendWelcomeEmailOauth(
    email: string,
    data: { subject: string; username: string; token: string },
  ): Promise<void> {
    try {
      const verifyUrl = this.configService.get('LOGIN_URL');
      const templateSource = await this.readTemplateFile(
        this.welcomeTemplatePath,
      );
      const emailTemplate = handlebars.compile(templateSource);

      const info = await this.transporter.sendMail({
        from: this.configService.get<string>('EMAIL_USER'),
        to: email,
        subject: data.subject,
        html: emailTemplate({
          appName: 'Banter',
          username: data.username,
          verificationLink: verifyUrl,
          title: 'Verification Email',
        }),
      });

      this.logger.log(
        `Welcome email sent successfully to ${email}. MessageId: ${info.messageId}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(
        `Failed to send welcome email to ${email}: ${errorMessage}`,
        error,
      );

      console.error(
        `Error sending email with template: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async forgetPasswordEmail(
    email: string,
    data: { subject: string; username: string; token: string },
  ): Promise<void> {
    try {
      const verifyUrl = this.configService.get('PASSWORD_URL');
      const verificationUrl = `${verifyUrl}?token=${data.token}`;
      const templateSource = await this.readTemplateFile(
        this.forgetPasswordTemplatePath,
      );
      const emailTemplate = handlebars.compile(templateSource);

      const info = await this.transporter.sendMail({
        from: this.configService.get<string>('EMAIL_USER'),
        to: email,
        subject: data.subject,
        html: emailTemplate({
          appName: 'Banter',
          username: data.username,
          resetPasswordLink: verificationUrl,
          title: 'Forgot Password',
        }),
      });

      this.logger.log(
        `Welcome email sent successfully to ${email}. MessageId: ${info.messageId}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(
        `Failed to send welcome email to ${email}: ${errorMessage}`,
        error,
      );

      console.error(
        `Error sending email with template: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async sendPasswordChangeConfirmation(
    email: string,
    data: { subject: string; username: string },
  ): Promise<void> {
    try {
      const loginUrl = this.configService.get('LOGIN_URL');

      const templateSource = await this.readTemplateFile(
        this.sendPasswordChangeConfirmationTemplatePath,
      );
      const emailTemplate = handlebars.compile(templateSource);

      const info = await this.transporter.sendMail({
        from: this.configService.get<string>('EMAIL_USER'),
        to: email,
        subject: data.subject,
        html: emailTemplate({
          appName: 'Vidora',
          username: data.username,
          userEmail: email,
          loginUrl: loginUrl,
          title: 'Password Change Confirmation',
        }),
      });

      this.logger.log(
        `Welcome email sent successfully to ${email}. MessageId: ${info.messageId}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(
        `Failed to send welcome email to ${email}: ${errorMessage}`,
        error,
      );

      console.error(
        `Error sending email with template: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
