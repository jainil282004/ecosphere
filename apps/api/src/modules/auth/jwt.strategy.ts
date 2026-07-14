import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';

import { PassportStrategy } from '@nestjs/passport';

import { ExtractJwt, Strategy } from 'passport-jwt';

import { ConfigService } from '@nestjs/config';

import type { Request } from 'express';

import { AuthService } from './auth.service';

import { AuthRepository } from '../../database/repositories/auth.repository';

import { ACCESS_COOKIE } from '../../common/security/cookie.config';

import type { AuthenticatedUser } from '../../common/types/request.types';



interface JwtPayload {

  sub: string;

  email: string;

}



function extractJwtFromCookie(request: Request): string | null {

  const token = request.cookies?.[ACCESS_COOKIE];

  return typeof token === 'string' ? token : null;

}



@Injectable()

export class JwtStrategy extends PassportStrategy(Strategy) {

  constructor(

    private readonly authRepository: AuthRepository,

    private readonly authService: AuthService,

    configService: ConfigService,

  ) {

    super({

      jwtFromRequest: ExtractJwt.fromExtractors([

        extractJwtFromCookie,

        ExtractJwt.fromAuthHeaderAsBearerToken(),

      ]),

      ignoreExpiration: false,

      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET'),

    });

  }



  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {

    const dbUser = await this.authRepository.findUserById(payload.sub);



    if (!dbUser || !dbUser.isActive) {

      throw new UnauthorizedException('Account inactive.');

    }



    return this.authService.buildAuthenticatedUser(

      dbUser.id,

      dbUser.email,

      dbUser.firstName,

      dbUser.lastName,

    );

  }

}


