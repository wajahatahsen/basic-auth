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
import { ObjectId, Repository } from 'typeorm';
import { UserDto } from './dto/user-dto';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(@InjectRepository(User) private userRepo: Repository<User>) {}

  async create(createUserDto: CreateUserDto): Promise<UserDto> {
    this.logger.log('Creating new user');
    const existingUser = await this.userRepo.findOne({
      where: { username: createUserDto.username },
    });
    if (existingUser) {
      this.logger.log('yo');
      throw new ConflictException('Username is already taken');
    }

    const newUser = this.userRepo.create({
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
      throw new NotFoundException(`User with username '${username}' not found`);
    }
    return user;
  }

  async update(_id: string, updateUserDto: UpdateUserDto) {
    this.logger.log(`Updating user having id: ${_id}`);
    return this.userRepo.update(new ObjectId(_id), updateUserDto);
  }

  async remove(_id: string) {
    this.logger.log(`Removing user having id: ${_id}`);
    return this.userRepo.delete(new ObjectId(_id));
  }
}
