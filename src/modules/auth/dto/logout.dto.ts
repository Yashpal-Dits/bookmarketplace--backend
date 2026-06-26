import { ApiProperty } from '@nestjs/swagger';

export class LogoutDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIs...', description: 'Refresh token to invalidate' })
  refreshToken!: string;
}