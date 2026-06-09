import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

interface JwtTokenPayload {
  sub: string;
  email: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);
    if (user && (await bcrypt.compare(password, user.passwordHash))) {
      return user;
    }
    return null;
  }

  login(user: User) {
    const payload: JwtTokenPayload = { sub: user.id, email: user.email };
    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: this.signRefreshToken(payload),
      user: { id: user.id, name: user.name, email: user.email },
    };
  }

  /** Current authenticated user's public profile (for GET /auth/me). */
  async me(userId: string) {
    const user = await this.usersService.findOne(userId);
    return { id: user.id, name: user.name, email: user.email };
  }

  /**
   * Validates a refresh token and issues a fresh access token. Refresh tokens
   * are stateless (not persisted) in Phase 1 — they are verified by signature
   * and expiry only.
   */
  async refresh(refreshToken: string): Promise<{ access_token: string }> {
    let decoded: JwtTokenPayload;
    try {
      decoded = this.jwtService.verify<JwtTokenPayload>(refreshToken, {
        secret: this.refreshSecret(),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Ensure the user still exists before minting a new access token.
    const user = await this.usersService.findByEmail(decoded.email);
    if (!user || user.id !== decoded.sub) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const payload: JwtTokenPayload = { sub: user.id, email: user.email };
    return { access_token: this.jwtService.sign(payload) };
  }

  private signRefreshToken(payload: JwtTokenPayload): string {
    const expiresIn = this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '30d');
    return this.jwtService.sign(payload, {
      secret: this.refreshSecret(),
      expiresIn: expiresIn as `${number}d`,
    });
  }

  /** Falls back to the access-token secret when no dedicated one is set. */
  private refreshSecret(): string {
    return this.config.get<string>(
      'JWT_REFRESH_SECRET',
      this.config.get<string>('JWT_SECRET', 'change-this-secret-in-production'),
    );
  }
}
