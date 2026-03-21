import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { UsersService } from '../../users/users.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor(
        private usersService: UsersService,
    ) {
        super({
            clientID: process.env.GOOGLE_CLIENT_ID ?? '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
            callbackURL:
                process.env.GOOGLE_CALLBACK_URL ??
                'http://localhost:3001/auth/google/callback',
            scope: ['email', 'profile'],
        });
    }

    async validate(
        _accessToken: string,
        _refreshToken: string,
        profile: any,
        done: VerifyCallback,
    ): Promise<any> {
        const { id, emails, name } = profile;
        const user = await this.usersService.findOrCreateGoogleUser({
            googleId: id,
            email: emails[0].value,
            firstName: name?.givenName ?? '',
            lastName: name?.familyName ?? '',
        });
        done(null, user);
    }
}
