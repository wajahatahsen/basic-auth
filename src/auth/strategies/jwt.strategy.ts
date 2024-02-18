import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { JwtModuleOptions } from 'src/config/jwt/jwt-module.options';
import { AuthService } from '../auth.service';
import { Request } from 'express';
import User from 'src/user/entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  private readonly logger = new Logger(JwtStrategy.name);
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: JwtStrategy.jwtExtractor,
      secretOrKey: JwtModuleOptions.secret,
    });
  }

  async validate(payload: JwtPayload) {
    this.logger.log('validating jwt');
    if (!this.authService.validateJwtPayload(payload)) {
      throw new UnauthorizedException('Token has expired');
    }
    const user: User = await this.authService.validateJwtUser(payload);
    const { _id, username } = user;
    return { sub: _id, username: username };
  }

  static jwtExtractor(req: Request) {
    const extractor = ExtractJwt.fromExtractors([
      ExtractJwt.fromAuthHeaderAsBearerToken(),
      (request: Request) => request?.cookies?.jwt,
    ]);
    const jwt = extractor(req);
    return jwt;
  }
}
