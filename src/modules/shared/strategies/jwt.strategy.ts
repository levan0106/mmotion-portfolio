import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../services/auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key',
    });
  }

  async validate(payload: any) {
    const { userId } = payload;
    
    try {
      const user = await this.authService.getUserById(userId);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      
      return {
        userId: user.userId,
        username: user.username,
        authState: user.authState,
        isPasswordSet: user.isPasswordSet,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
