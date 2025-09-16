import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';

// Zod Schemas
export const SignupSchema = z.object({
  username: z.string().min(1, { message: 'Username is required' }),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters long' })
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{6,}$/,
      {
        message:
          'Password must contain at least one uppercase letter, one lowercase letter, and one digit',
      },
    ),
  email: z.string().email({ message: 'Invalid email format' }),
});

export const LoginSchema = z.object({
  email: z.string().email({ message: 'Invalid email format' }),
  password: z
    .string()
    .min(1, { message: 'Password is required' })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,}$/, {
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, and one digit',
    }),
});

export const VerifyEmailSchema = z.object({
  token: z.string().min(1, { message: 'Verification token is required' }),
});

export const EmailValidationSchema = z.object({
  email: z.string().email({ message: 'Invalid email format' }),
});

export const ForgotPasswordSchema = z.object({
  token: z.string().min(1, { message: 'Verification token is required' }),
  newPassword: z
    .string()
    .min(6, { message: 'New password must be at least 6 characters long' })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,}$/, {
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, and one digit',
    }),
  confirmPassword: z
    .string()
    .min(6, { message: 'Confirm password is required' })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,}$/, {
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, and one digit',
    }),
});

// Type inference from Zod schemas
export type SignupDto = z.infer<typeof SignupSchema>;
export type LoginDto = z.infer<typeof LoginSchema>;
export type VerifyEmailDto = z.infer<typeof VerifyEmailSchema>;
export type EmailValidationDto = z.infer<typeof EmailValidationSchema>;
export type ForgotPasswordDto = z.infer<typeof ForgotPasswordSchema>;

// Swagger DTO classes for documentation
export class SignupDtoSwagger {
  @ApiProperty({ example: 'johndoe', description: 'Username for the account' })
  username: string;

  @ApiProperty({ example: 'john@example.com', description: 'Email address' })
  email: string;

  @ApiProperty({
    example: 'securePassword123',
    description: 'Password (minimum 6 characters)',
  })
  password: string;
}

export class LoginDtoSwagger {
  @ApiProperty({ example: 'john@example.com', description: 'Email address' })
  email: string;

  @ApiProperty({ example: 'securePassword123', description: 'Password' })
  password: string;
}

export class VerifyEmailDtoSwagger {
  @ApiProperty({
    example: 'abc123def456...',
    description: 'Email verification token',
  })
  token: string;
}

export class EmailValidationDtoSwagger {
  @ApiProperty({ example: 'john@example.com', description: 'Email address' })
  email: string;
}
