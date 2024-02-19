import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import User from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserDto } from './dto/user-dto';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(@InjectRepository(User) private userRepo: Repository<User>) {}

  async create(createUserDto: CreateUserDto): Promise<UserDto> {
    this.logger.log('Creating new user');
    const existingUser: User = await this.userRepo.findOne({
      where: { username: createUserDto.username },
    });
    if (existingUser) {
      this.logger.error('Username is already taken');
      throw new ConflictException('Username is already taken');
    }

    const newUser: User = this.userRepo.create({
      ...createUserDto,
      password: await bcrypt.hash(createUserDto.password, 10),
    });

    return this.userRepo.save(newUser);
  }

  async findAll(): Promise<User[]> {
    this.logger.log('Fetching all users');
    return this.userRepo.find();
  }

  async findByUsername(username: string): Promise<User | null> {
    this.logger.log(`Fetching user having username: ${username}`);
    const user: User | undefined = await this.userRepo.findOne({
      where: { username: username },
    });
    if (!user) {
      this.logger.error(`User with username ${username} not found`);
      throw new NotFoundException(`User with username '${username}' not found`);
    }
    return user;
  }

  async update(username: string, updateUserDto: UpdateUserDto): Promise<User> {
    this.logger.log(`Updating user having username: ${username}`);
    const userToUpdate = await this.userRepo.findOne({
      where: { username: username },
    });
    if (!userToUpdate) {
      this.logger.error(`User with username ${username} not found`);
      throw new NotFoundException(`User with username ${username} not found`);
    }

    if (updateUserDto.password) {
      const hashedPassword = await bcrypt.hash(updateUserDto.password, 10);
      updateUserDto.password = hashedPassword;
    }
    if (updateUserDto.username) {
      const existingUser: User = await this.userRepo.findOne({
        where: { username: updateUserDto.username },
      });
      if (existingUser) {
        this.logger.error(
          `Username: ${updateUserDto.username} is already taken`,
        );
        throw new ConflictException(
          `Username: ${updateUserDto.username} is already taken`,
        );
      }
    }

    Object.assign(userToUpdate, updateUserDto);

    return await this.userRepo.save(userToUpdate);
  }

  async remove(username: string) {
    this.logger.log(`Removing user having username: ${username}`);
    const deleteResult = await this.userRepo.delete({ username: username });
    if (deleteResult.affected === 0) {
      this.logger.error(`User with username ${username} not found`);
      throw new NotFoundException(`User with username ${username} not found`);
    }
    return deleteResult.affected > 0;
  }
}
