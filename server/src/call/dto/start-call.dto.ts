import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum CallType {
  VIDEO = 'video',
  AUDIO = 'audio',
  SCREEN_SHARE = 'screen',
}

export class StartCallDto {
  @ApiProperty({ description: 'Room ID where the call takes place' })
  @IsString()
  roomId: string;

  @ApiProperty({ description: 'Type of call', enum: CallType })
  @IsEnum(CallType)
  @IsOptional()
  type?: CallType = CallType.VIDEO;
}
