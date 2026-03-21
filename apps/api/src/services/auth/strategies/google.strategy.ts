import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { UsersService } from '../../users/users.service';

type GoogleProfile = {
    id: string;
    emails?: Array<{ value: string }>;
    name?: {
        givenName?: string;
        familyName?: string;
    };
};

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
        profile: GoogleProfile,
        done: VerifyCallback,
    ): Promise<void> {
        const { id, emails, name } = profile;
        const email = emails?.[0]?.value;
        if (!email) {
            done(new Error('Google profile missing email'));
            return;
        }

        const user = await this.usersService.findOrCreateGoogleUser({
            googleId: id,
            email,
            firstName: name?.givenName ?? '',
            lastName: name?.familyName ?? '',
        });
        done(null, user);
    }
}
