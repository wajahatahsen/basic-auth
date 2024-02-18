import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SigninDto } from './dto/signin.dto';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('signin')
  async signIn(
    @Res({ passthrough: true }) res: Response,
    @Body() signInDto: SigninDto,
  ) {
    const accessToken = await this.authService.signIn(signInDto);
    res.cookie('jwt', accessToken);
    return { access_token: accessToken };
  }
}
