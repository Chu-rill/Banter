import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from './email.service';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs/promises';
import * as handlebars from 'handlebars';

jest.mock('nodemailer');
jest.mock('fs/promises');
jest.mock('handlebars');

describe('EmailService', () => {
  let service: EmailService;
  let configService: jest.Mocked<ConfigService>;
  let mockTransporter: jest.Mocked<nodemailer.Transporter>;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    mockTransporter = {
      sendMail: jest.fn(),
    } as any;

    (nodemailer.createTransporter as jest.Mock).mockReturnValue(mockTransporter);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    configService = module.get(ConfigService);

    // Mock logger to avoid console output during tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('constructor', () => {
    it('should create nodemailer transporter with correct config', () => {
      configService.get
        .mockReturnValueOnce('smtp.gmail.com')
        .mockReturnValueOnce('587')
        .mockReturnValueOnce('test@gmail.com')
        .mockReturnValueOnce('password');

      expect(nodemailer.createTransporter).toHaveBeenCalledWith({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        service: 'gmail',
        auth: {
          user: 'test@gmail.com',
          pass: 'password',
        },
      });
    });
  });

  describe('sendWelcomeEmail', () => {
    const emailData = {
      subject: 'Welcome to Banter',
      username: 'testuser',
      token: 'test-token-123',
    };

    beforeEach(() => {
      configService.get
        .mockReturnValueOnce('http://localhost:3000')
        .mockReturnValueOnce('test@gmail.com');
      
      (fs.readFile as jest.Mock).mockResolvedValue('<html>{{username}}</html>');
      (handlebars.compile as jest.Mock).mockReturnValue(() => '<html>testuser</html>');
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'msg123' });
    });

    it('should send welcome email successfully', async () => {
      await service.sendWelcomeEmail('user@example.com', emailData);

      expect(fs.readFile).toHaveBeenCalledWith(
        expect.stringContaining('src/views/welcome.hbs'),
        'utf-8',
      );
      expect(handlebars.compile).toHaveBeenCalled();
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'test@gmail.com',
        to: 'user@example.com',
        subject: 'Welcome to Banter',
        html: '<html>testuser</html>',
      });
    });

    it('should handle template reading error', async () => {
      (fs.readFile as jest.Mock).mockRejectedValue(new Error('File not found'));

      await service.sendWelcomeEmail('user@example.com', emailData);

      expect(Logger.prototype.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to send welcome email'),
        expect.any(Error),
      );
    });

    it('should handle email sending error', async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error('SMTP Error'));

      await service.sendWelcomeEmail('user@example.com', emailData);

      expect(Logger.prototype.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to send welcome email'),
        expect.any(Error),
      );
    });
  });

  describe('forgetPasswordEmail', () => {
    const emailData = {
      subject: 'Reset Password',
      username: 'testuser',
      token: 'reset-token-123',
    };

    beforeEach(() => {
      configService.get
        .mockReturnValueOnce('http://localhost:3000/reset')
        .mockReturnValueOnce('test@gmail.com');
      
      (fs.readFile as jest.Mock).mockResolvedValue('<html>{{username}}</html>');
      (handlebars.compile as jest.Mock).mockReturnValue(() => '<html>testuser</html>');
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'msg123' });
    });

    it('should send forgot password email successfully', async () => {
      await service.forgetPasswordEmail('user@example.com', emailData);

      expect(fs.readFile).toHaveBeenCalledWith(
        expect.stringContaining('src/views/forgot-password.hbs'),
        'utf-8',
      );
      expect(handlebars.compile).toHaveBeenCalled();
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'test@gmail.com',
        to: 'user@example.com',
        subject: 'Reset Password',
        html: '<html>testuser</html>',
      });
    });

    it('should handle template reading error', async () => {
      (fs.readFile as jest.Mock).mockRejectedValue(new Error('File not found'));

      await service.forgetPasswordEmail('user@example.com', emailData);

      expect(Logger.prototype.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to send welcome email'),
        expect.any(Error),
      );
    });

    it('should handle email sending error', async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error('SMTP Error'));

      await service.forgetPasswordEmail('user@example.com', emailData);

      expect(Logger.prototype.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to send welcome email'),
        expect.any(Error),
      );
    });
  });

  describe('sendPasswordChangeConfirmation', () => {
    const emailData = {
      subject: 'Password Changed',
      username: 'testuser',
    };

    beforeEach(() => {
      configService.get
        .mockReturnValueOnce('http://localhost:3000/login')
        .mockReturnValueOnce('test@gmail.com');
      
      (fs.readFile as jest.Mock).mockResolvedValue('<html>{{username}}</html>');
      (handlebars.compile as jest.Mock).mockReturnValue(() => '<html>testuser</html>');
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'msg123' });
    });

    it('should send password change confirmation email successfully', async () => {
      await service.sendPasswordChangeConfirmation('user@example.com', emailData);

      expect(fs.readFile).toHaveBeenCalledWith(
        expect.stringContaining('src/views/password-change-confirm.hbs'),
        'utf-8',
      );
      expect(handlebars.compile).toHaveBeenCalled();
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'test@gmail.com',
        to: 'user@example.com',
        subject: 'Password Changed',
        html: '<html>testuser</html>',
      });
    });

    it('should handle template reading error', async () => {
      (fs.readFile as jest.Mock).mockRejectedValue(new Error('File not found'));

      await service.sendPasswordChangeConfirmation('user@example.com', emailData);

      expect(Logger.prototype.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to send welcome email'),
        expect.any(Error),
      );
    });

    it('should handle email sending error', async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error('SMTP Error'));

      await service.sendPasswordChangeConfirmation('user@example.com', emailData);

      expect(Logger.prototype.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to send welcome email'),
        expect.any(Error),
      );
    });
  });

  describe('readTemplateFile', () => {
    it('should read template file successfully', async () => {
      (fs.readFile as jest.Mock).mockResolvedValue('<html>Template</html>');

      const result = await (service as any).readTemplateFile('/path/to/template.hbs');

      expect(fs.readFile).toHaveBeenCalledWith('/path/to/template.hbs', 'utf-8');
      expect(result).toBe('<html>Template</html>');
    });

    it('should throw error when file reading fails', async () => {
      (fs.readFile as jest.Mock).mockRejectedValue(new Error('File not found'));

      await expect(
        (service as any).readTemplateFile('/path/to/template.hbs'),
      ).rejects.toThrow('Error reading email template file: Error: File not found');
    });
  });
});