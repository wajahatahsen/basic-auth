import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import User from 'src/user/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { SigninDto } from './dto/signin.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string) {
    this.logger.log(`validating user: ${username}`);
    const user: User = await this.userService.findByUsername(username);

    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    } else {
      this.logger.error('Invalid credentials');
      throw new BadRequestException('Invalid credentials');
    }
  }

  async validateJwtUser({ username }: JwtPayload) {
    this.logger.log(`validating jwt user: ${username}`);
    const user: User = await this.userService.findByUsername(username);
    if (user) return user;
    else {
      this.logger.error('Invalid credentials');
      throw new BadRequestException('Invalid credentials');
    }
  }

  validateJwtPayload(payload: JwtPayload): boolean {
    this.logger.log('validating jwt');
    const expirationTime = payload.exp * 1000;
    const currentTime = Date.now();
    let isJwtValid: boolean = false;

    if (expirationTime > currentTime) {
      isJwtValid = true;
    }
    return isJwtValid;
  }

  async signIn(signinDto: SigninDto): Promise<string> {
    this.logger.log(`signing in user: ${signinDto.username}`);
    const user: User = await this.userService.findByUsername(
      signinDto.username,
    );
    const isMatch: boolean = await bcrypt.compare(
      signinDto.password,
      user.password,
    );

    if (user && isMatch) {
      const accessToken: string = await this.jwtService.signAsync({
        sub: user._id,
        username: user.username,
      });
      return accessToken;
    } else {
      this.logger.error('Invalid credentials');
      throw new BadRequestException('Invalid credentials');
    }
  }
}
