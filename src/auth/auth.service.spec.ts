import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import User from '../user/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { JwtPayload } from './interfaces/jwt-payload.interface';

describe('AuthService', () => {
  let service: AuthService;
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: {
            findByUsername: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user if username and password are valid', async () => {
      const mockUser: User = {
        _id: new ObjectId(),
        username: 'testuser',
        password: await bcrypt.hash('password', 10),
        name: '',
        email: '',
      };
      jest.spyOn(userService, 'findByUsername').mockResolvedValue(mockUser);

      const result = await service.validateUser('testuser', 'password');
      expect(result).toEqual(mockUser);
    });

    it('should throw BadRequestException if username or password are invalid', async () => {
      jest.spyOn(userService, 'findByUsername').mockResolvedValue(null);

      await expect(
        service.validateUser('testuser', 'password'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('validateJwtUser', () => {
    it('should return user if user exists in the database', async () => {
      const jwtPayload: JwtPayload = {
        username: 'testuser',
        sub: '',
        exp: 0,
      };
      const mockUser: User = {
        _id: new ObjectId(),
        username: 'testuser',
        password: 'hashedPassword',
        name: 'test',
        email: 'test@email.com',
      };
      jest.spyOn(userService, 'findByUsername').mockResolvedValue(mockUser);

      const result = await service.validateJwtUser(jwtPayload);
      expect(result).toEqual(mockUser);
    });

    it('should throw BadRequestException if user does not exist in the database', async () => {
      jest.spyOn(userService, 'findByUsername').mockResolvedValue(null);
      const jwtPayload: JwtPayload = {
        username: 'nonexistentuser',
        sub: '',
        exp: 0,
      };

      await expect(service.validateJwtUser(jwtPayload)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('validateJwtPayload', () => {
    it('should return true if JWT payload expiration time is in the future', () => {
      const currentTime = Date.now();
      const futureTime = currentTime + 3600000; // 1 hour in milliseconds
      const payload: JwtPayload = {
        exp: futureTime / 1000,
        sub: '',
        username: '',
      }; // Converting milliseconds to seconds

      const result = service.validateJwtPayload(payload);
      expect(result).toBe(true);
    });

    it('should return false if JWT payload expiration time is in the past', () => {
      const currentTime = Date.now();
      const pastTime = currentTime - 3600000; // 1 hour in milliseconds
      const payload: JwtPayload = {
        exp: pastTime / 1000,
        sub: '',
        username: '',
      }; // Converting milliseconds to seconds

      const result = service.validateJwtPayload(payload);
      expect(result).toBe(false);
    });
  });

  describe('signIn', () => {
    // Your existing tests for signIn
  });
});
