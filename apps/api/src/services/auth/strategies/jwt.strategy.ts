import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

type JwtPayload = {
  sub: string;
  email: string;
  role: string;
  sessionVersion?: number;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    if (payload.sessionVersion !== undefined) {
      const user = await this.usersService.findOneForSessionCheck(payload.sub);
      if (!user || (user as unknown as { sessionVersion: number }).sessionVersion !== payload.sessionVersion) {
        throw new UnauthorizedException('Session expired — another device logged in');
      }
    }
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
