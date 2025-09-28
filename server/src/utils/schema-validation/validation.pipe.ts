import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { ZodError, ZodSchema } from 'zod';

@Injectable()
export class ZodPipe implements PipeTransform<any> {
  constructor(
    private schema: ZodSchema,
    private options?: { forbidEmpty?: boolean },
  ) {}

  transform(value: unknown) {
    if (
      this.options?.forbidEmpty &&
      (!value || Object.keys(value).length === 0)
    ) {
      throw new BadRequestException('Request body is empty');
    }
    try {
      const parsedValue = this.schema.parse(value);
      return parsedValue;
    } catch (err) {
      if (err instanceof ZodError) {
        const errorMessages = err.issues.map(
          (issue) => `${issue.path.join('.')}: ${issue.message}`,
        );
        throw new BadRequestException(errorMessages);
      }
      throw err;
    }
  }
}
