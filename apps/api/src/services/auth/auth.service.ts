import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { UsersService } from '../users/users.service';
import { UserDocument } from '../users/schemas/user.schema';
import { AuthResponse, LoginDto, RegisterDto, UserRole } from '@emergensee/shared';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) { }

  async validateUser(email: string, password: string): Promise<UserDocument | null> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.generateAuthResponse(user);
  }

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const user = await this.usersService.create({
      email: registerDto.email,
      password: registerDto.password,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      role: UserRole.MEMBER, // default role for self-registration
    });
    return this.generateAuthResponse(user);
  }

  /**
   * Verifies the id_token issued by Google Identity Services and returns
   * the same AuthResponse shape as email/password login.
   */
  async loginWithGoogleToken(idToken: string): Promise<AuthResponse> {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const client = new OAuth2Client(clientId);

    let payload: TokenPayload | undefined;
    try {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: clientId,
      });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException('Invalid Google token');
    }

    if (!payload?.email) {
      throw new UnauthorizedException('Google token missing email claim');
    }

    const user = await this.usersService.findOrCreateGoogleUser({
      googleId: payload.sub as string,
      email: payload.email as string,
      firstName: (payload.given_name as string) ?? '',
      lastName: (payload.family_name as string) ?? '',
    });

    return this.generateAuthResponse(user);
  }

  async cameraLogin(code: string, password: string): Promise<AuthResponse> {
    const user = await this.usersService.findByCameraCode(code);
    if (!user) throw new UnauthorizedException('Invalid code or password');
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid code or password');
    user.sessionVersion = (user.sessionVersion ?? 0) + 1;
    await user.save();
    return this.generateAuthResponse(user);
  }

  private generateAuthResponse(user: UserDocument): AuthResponse {
    const jwtPayload: Record<string, unknown> = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };
    if (user.role === UserRole.CAMERA) {
      jwtPayload.sessionVersion = user.sessionVersion ?? 0;
    }
    const accessToken = this.jwtService.sign(jwtPayload);
    const refreshToken = this.jwtService.sign(jwtPayload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
    });

    const userObject = user.toObject() as Record<string, unknown>;
    delete userObject.password;
    delete userObject.sessionVersion;

    return {
      accessToken,
      refreshToken,
      user: {
        ...userObject,
        id: (userObject._id as { toString(): string }).toString(),
      } as AuthResponse['user'],
    };
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const newAccessToken = this.jwtService.sign({
        sub: payload.sub,
        email: payload.email,
        role: payload.role,
      });

      return { accessToken: newAccessToken };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
