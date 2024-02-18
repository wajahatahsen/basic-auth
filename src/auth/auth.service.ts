import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import * as bcrypt from 'bcrypt';
import User from 'src/user/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { SigninDto } from './dto/signin.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async validateUser(userName: string, password: string) {
    const user: User = await this.userService.findByUsername(userName);
    const isMatch = await bcrypt.compare(password, user.password);

    if (user && isMatch) {
      return user;
    } else {
      throw new BadRequestException('Invalid credentials');
    }
  }

  async validateJwtUser({ username }: JwtPayload) {
    const user: User = await this.userService.findByUsername(username);
    if (user) return user;
    else throw new BadRequestException('Invalid credentials');
  }

  validateJwtPayload(payload: JwtPayload): boolean {
    const expirationTime = payload.exp * 1000;
    const currentTime = Date.now();
    let isJwtValid: boolean = false;

    if (expirationTime > currentTime) {
      isJwtValid = true;
    }
    return isJwtValid;
  }

  async signIn(signinDto: SigninDto): Promise<string> {
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
      throw new BadRequestException('Invalid credentials');
    }
  }
}
