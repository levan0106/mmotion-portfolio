import { Controller, Post, Get, Put, Body, Param, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Public } from '../decorators/public.decorator';
import { CurrentUser } from '../decorators/user.decorator';
import { 
  LoginOrRegisterDto, 
  UpdateProfileDto, 
  SetPasswordDto, 
  ChangePasswordDto, 
  VerifyEmailDto,
  AuthResponseDto 
} from '../dto/auth.dto';

@ApiTags('Authentication')
@Controller('api/v1/auth')
@UseGuards(JwtAuthGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Login or register user with progressive authentication
   */
  @Post('login-or-register')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Login or register user with progressive authentication',
    description: 'Login existing user or create new user. Password required only for users with password set.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Login successful', 
    type: AuthResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Invalid input or password required' })
  @ApiResponse({ status: 401, description: 'Invalid password' })
  async loginOrRegister(@Body() loginDto: LoginOrRegisterDto): Promise<AuthResponseDto> {
    const result = await this.authService.loginOrRegister(
      loginDto.username, 
      loginDto.password
    );

    return {
      user: {
        userId: result.user.userId,
        username: result.user.username,
        email: result.user.email,
        fullName: result.user.fullName,
        phone: result.user.phone,
        dateOfBirth: result.user.dateOfBirth?.toISOString().split('T')[0],
        address: result.user.address,
        avatarText: result.user.avatarText,
        isEmailVerified: result.user.isEmailVerified,
        isProfileComplete: result.user.isProfileComplete,
        isPasswordSet: result.user.isPasswordSet,
        authState: result.user.authState,
      },
      account: {
        accountId: result.account.accountId,
        name: result.account.name,
        email: result.account.email,
        baseCurrency: result.account.baseCurrency,
        isInvestor: result.account.isInvestor,
        isMainAccount: result.account.isMainAccount,
      },
      token: result.token,
    };
  }

  /**
   * Check user status by username
   */
  @Get('check-user/:username')
  @Public()
  @ApiOperation({ 
    summary: 'Check user status by username',
    description: 'Check if user exists and whether password is required'
  })
  @ApiParam({ name: 'username', description: 'Username to check' })
  @ApiResponse({ 
    status: 200, 
    description: 'User status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        exists: { type: 'boolean' },
        requiresPassword: { type: 'boolean' },
        isProfileComplete: { type: 'boolean' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async checkUserStatus(@Param('username') username: string) {
    return await this.authService.checkUserStatus(username);
  }

  /**
   * Get user profile
   */
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getProfile(@CurrentUser() user: any) {
    return await this.authService.getUserById(user.userId);
  }

  /**
   * Update user profile
   */
  @Put('profile')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Update current user profile',
    description: 'Update user profile information. Email changes will require re-verification.'
  })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateProfile(
    @CurrentUser() user: any,
    @Body() profileDto: UpdateProfileDto
  ) {
    // Convert dateOfBirth string to Date if provided
    const profileData = {
      ...profileDto,
      dateOfBirth: profileDto.dateOfBirth ? new Date(profileDto.dateOfBirth) : undefined,
    };
    return await this.authService.updateProfile(user.userId, profileData);
  }

  /**
   * Set password for user
   */
  @Post('set-password')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Set password for current user',
    description: 'Set password for user who has not set one yet'
  })
  @ApiResponse({ status: 200, description: 'Password set successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 400, description: 'Invalid password format' })
  async setPassword(
    @CurrentUser() user: any,
    @Body() passwordDto: SetPasswordDto
  ) {
    await this.authService.setPassword(user.userId, passwordDto.password);
    return { message: 'Password set successfully' };
  }

  /**
   * Change password for user
   */
  @Post('change-password')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Change password for current user',
    description: 'Change password for user who already has one set'
  })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 401, description: 'Invalid current password' })
  @ApiResponse({ status: 400, description: 'Invalid password format' })
  async changePassword(
    @CurrentUser() user: any,
    @Body() changePasswordDto: ChangePasswordDto
  ) {
    await this.authService.changePassword(
      user.userId, 
      changePasswordDto.currentPassword, 
      changePasswordDto.newPassword
    );
    return { message: 'Password changed successfully' };
  }

  /**
   * Generate email verification token
   */
  @Post('send-verification-email')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Send email verification',
    description: 'Generate and send email verification token'
  })
  @ApiResponse({ status: 200, description: 'Verification email sent' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async sendVerificationEmail(@CurrentUser() user: any) {
    const token = await this.authService.generateEmailVerificationToken(user.userId);
    return { 
      message: 'Verification email sent',
      token // In production, this would be sent via email
    };
  }

  /**
   * Verify email with token
   */
  @Post('verify-email')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Verify email with token',
    description: 'Verify user email using verification token'
  })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid verification token' })
  async verifyEmail(@Body() verifyDto: VerifyEmailDto) {
    const user = await this.authService.verifyEmail(verifyDto.token);
    return { 
      message: 'Email verified successfully',
      user: {
        userId: user.userId,
        username: user.username,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        isProfileComplete: user.isProfileComplete,
      }
    };
  }
}
