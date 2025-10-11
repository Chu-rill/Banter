import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs/promises';
import * as handlebars from 'handlebars';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private resend: Resend;
  private useResend: boolean;
  private welcomeTemplatePath: string;
  private forgetPasswordTemplatePath: string;
  private sendPasswordChangeConfirmationTemplatePath: string;

  constructor(private readonly configService: ConfigService) {
    // Check if Resend API key is provided
    const resendApiKey = configService.get<string>('RESEND_API_KEY');
    this.useResend = !!resendApiKey;

    if (this.useResend) {
      this.resend = new Resend(resendApiKey);
      this.logger.log('Email service initialized with Resend');
    } else {
      // Fallback to SMTP (for local development)
      const port = Number(configService.get<string>('SERVICE_PORT'));
      this.transporter = nodemailer.createTransport({
        host: configService.get<string>('EMAIL_PROVIDER'),
        port: port,
        secure: port === 465, // true for 465, false for other ports
        service: 'gmail',
        auth: {
          user: configService.get<string>('EMAIL_USER'),
          pass: configService.get<string>('EMAIL_PASS'),
        },
        // Increase timeout for cloud environments
        connectionTimeout: 60000, // 60 seconds
        greetingTimeout: 30000, // 30 seconds
        socketTimeout: 60000, // 60 seconds
      });
      this.logger.log('Email service initialized with SMTP');
    }

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
      const htmlContent = emailTemplate({
        appName: 'Banter',
        username: data.username,
        verificationLink: verificationUrl,
        title: 'Verification Email',
      });

      if (this.useResend) {
        const { data: resendData, error } = await this.resend.emails.send({
          from: 'Banter <onboarding@resend.dev>', // Use your verified domain or resend.dev for testing
          to: [email],
          subject: data.subject,
          html: htmlContent,
        });

        if (error) {
          throw new Error(`Resend error: ${error.message}`);
        }

        this.logger.log(
          `Welcome email sent successfully to ${email}. MessageId: ${resendData.id}`,
        );
      } else {
        const info = await this.transporter.sendMail({
          from: this.configService.get<string>('EMAIL_USER'),
          to: email,
          subject: data.subject,
          html: htmlContent,
        });

        this.logger.log(
          `Welcome email sent successfully to ${email}. MessageId: ${info.messageId}`,
        );
      }
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
      const htmlContent = emailTemplate({
        appName: 'Banter',
        username: data.username,
        verificationLink: verifyUrl,
        title: 'Verification Email',
      });

      if (this.useResend) {
        const { data: resendData, error } = await this.resend.emails.send({
          from: 'Banter <onboarding@resend.dev>',
          to: [email],
          subject: data.subject,
          html: htmlContent,
        });

        if (error) {
          throw new Error(`Resend error: ${error.message}`);
        }

        this.logger.log(
          `Welcome email sent successfully to ${email}. MessageId: ${resendData.id}`,
        );
      } else {
        const info = await this.transporter.sendMail({
          from: this.configService.get<string>('EMAIL_USER'),
          to: email,
          subject: data.subject,
          html: htmlContent,
        });

        this.logger.log(
          `Welcome email sent successfully to ${email}. MessageId: ${info.messageId}`,
        );
      }
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
      const htmlContent = emailTemplate({
        appName: 'Banter',
        username: data.username,
        resetPasswordLink: verificationUrl,
        title: 'Forgot Password',
      });

      if (this.useResend) {
        const { data: resendData, error } = await this.resend.emails.send({
          from: 'Banter <onboarding@resend.dev>',
          to: [email],
          subject: data.subject,
          html: htmlContent,
        });

        if (error) {
          throw new Error(`Resend error: ${error.message}`);
        }

        this.logger.log(
          `Forgot password email sent successfully to ${email}. MessageId: ${resendData.id}`,
        );
      } else {
        const info = await this.transporter.sendMail({
          from: this.configService.get<string>('EMAIL_USER'),
          to: email,
          subject: data.subject,
          html: htmlContent,
        });

        this.logger.log(
          `Forgot password email sent successfully to ${email}. MessageId: ${info.messageId}`,
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(
        `Failed to send forgot password email to ${email}: ${errorMessage}`,
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
      const htmlContent = emailTemplate({
        appName: 'Banter',
        username: data.username,
        userEmail: email,
        loginUrl: loginUrl,
        title: 'Password Change Confirmation',
      });

      if (this.useResend) {
        const { data: resendData, error } = await this.resend.emails.send({
          from: 'Banter <onboarding@resend.dev>',
          to: [email],
          subject: data.subject,
          html: htmlContent,
        });

        if (error) {
          throw new Error(`Resend error: ${error.message}`);
        }

        this.logger.log(
          `Password change confirmation email sent successfully to ${email}. MessageId: ${resendData.id}`,
        );
      } else {
        const info = await this.transporter.sendMail({
          from: this.configService.get<string>('EMAIL_USER'),
          to: email,
          subject: data.subject,
          html: htmlContent,
        });

        this.logger.log(
          `Password change confirmation email sent successfully to ${email}. MessageId: ${info.messageId}`,
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(
        `Failed to send password change confirmation email to ${email}: ${errorMessage}`,
        error,
      );

      console.error(
        `Error sending email with template: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
