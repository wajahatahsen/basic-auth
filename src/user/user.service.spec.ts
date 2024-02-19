import { Test, TestingModule } from '@nestjs/testing';
import { ObjectId } from 'mongodb';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import User from './entities/user.entity';
import { UserService } from './user.service';
import { UserDto } from './dto/user-dto';
import { UpdateUserDto } from './dto/update-user.dto';

describe('UserService', () => {
  let service: UserService;
  let userRepository: Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useClass: Repository<User>,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto = {
        name: 'John Doe',
        username: 'johndoe',
        email: 'john@example.com',
        password: 'password',
      };

      const objId = new ObjectId();
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

      jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(null);

      jest.spyOn(userRepository, 'create').mockReturnValue({
        _id: objId,
        ...createUserDto,
        password: hashedPassword,
      } as User);

      jest.spyOn(userRepository, 'save').mockResolvedValueOnce({
        _id: objId,
        ...createUserDto,
        password: hashedPassword,
      } as User);

      const result: UserDto = await service.create(createUserDto);

      expect(result).toEqual({
        _id: objId,
        ...createUserDto,
        password: hashedPassword,
      });
    });

    it('should throw ConflictException if username is already taken', async () => {
      const existingUser = {
        _id: new ObjectId(),
        name: 'Existing User',
        username: 'existinguser',
        email: 'existing@example.com',
        password: 'password',
      };

      jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(existingUser);

      const createUserDto = {
        name: 'John Doe',
        username: 'existinguser',
        email: 'john@example.com',
        password: 'password',
      };

      await expect(service.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findByUsername', () => {
    it('should find user by username', async () => {
      const username = 'johndoe';
      const user = {
        _id: '1',
        name: 'John Doe',
        username,
        email: 'john@example.com',
        password: 'password',
      } as unknown as User;
      jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(user);

      const result = await service.findByUsername(username);

      expect(result).toEqual(user);
    });

    it('should throw NotFoundException if user with given username is not found', async () => {
      const username = 'nonexistentuser';
      jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(null);

      await expect(service.findByUsername(username)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
  describe('findAll', () => {
    it('should return an array of users', async () => {
      const mockUsers: User[] = [
        {
          _id: new ObjectId(),
          name: 'User 1',
          username: 'user1',
          email: 'user1@example.com',
          password: await bcrypt.hash('pass1', 10),
        },
        {
          _id: new ObjectId(),
          name: 'User 2',
          username: 'user2',
          email: 'user2@example.com',
          password: await bcrypt.hash('pass2', 10),
        },
      ];

      jest.spyOn(userRepository, 'find').mockResolvedValueOnce(mockUsers);

      const result = await service.findAll();

      expect(result).toEqual(mockUsers);
    });

    it('should return an empty array when the users table is empty', async () => {
      jest.spyOn(userRepository, 'find').mockResolvedValueOnce([]);

      const result = await service.findAll();
      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update a user when user exists', async () => {
      const userId = new ObjectId();
      const updatedUser: UpdateUserDto = {
        name: 'Updated Name',
        password: 'newpassword',
      };
      const userToUpdate: User = new User();

      userToUpdate._id = userId;
      userToUpdate.name = 'Original Name';

      jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(userToUpdate);
      jest.spyOn(userRepository, 'save').mockResolvedValueOnce(userToUpdate);

      const result = await service.update(userId, updatedUser);

      expect(result.name).toEqual(updatedUser.name);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { _id: userId },
      });
      expect(userRepository.save).toHaveBeenCalledWith(userToUpdate);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      const userId = new ObjectId();
      const updateUserDto: UpdateUserDto = { name: 'Updated Name' };

      jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(null);

      await expect(service.update(userId, updateUserDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { _id: userId },
      });
    });

    it('should throw ConflictException when same username exists', async () => {
      const existingUser: User = {
        _id: new ObjectId(),
        name: 'Existing User',
        username: 'existinguser',
        email: 'existing@example.com',
        password: 'password',
      };
      const userId = new ObjectId();
      const updateUserDto: UpdateUserDto = { username: 'existinguser' };
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(existingUser);

      await expect(service.update(userId, updateUserDto)).rejects.toThrow(
        ConflictException,
      );
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { _id: userId },
      });
    });
  });

  describe('remove', () => {
    it('should remove a user when user exists', async () => {
      const _id = new ObjectId();

      jest
        .spyOn(userRepository, 'delete')
        .mockResolvedValueOnce({ affected: 1, raw: '' });

      const result = await service.remove(_id);

      expect(result).toEqual(true);
      expect(userRepository.delete).toHaveBeenCalledWith(_id);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      const _id = new ObjectId();

      jest
        .spyOn(userRepository, 'delete')
        .mockResolvedValueOnce({ affected: 0, raw: '' });

      await expect(service.remove(_id)).rejects.toThrow(NotFoundException);
      expect(userRepository.delete).toHaveBeenCalledWith(_id);
    });
  });
});
