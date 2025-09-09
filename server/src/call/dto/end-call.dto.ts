import { IsString, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EndCallDto {
  @ApiProperty({ description: 'Call session ID' })
  @IsString()
  callSessionId: string;

  @ApiProperty({ description: 'Call duration in seconds' })
  @IsNumber()
  @Min(0)
  duration: number;
}
