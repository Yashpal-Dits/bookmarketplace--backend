import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ description: 'Current password' })
  currentPassword!: string;

  @ApiProperty({ description: 'New password' })
  newPassword!: string;
}