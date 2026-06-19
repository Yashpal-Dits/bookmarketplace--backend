import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { HashHelper } from '../../common/helpers/hash.helper';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../../common/constants/messages.constant';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.usersRepository.countByEmail(createUserDto.email);

    if (existingUser > 0) {
      throw new ConflictException(ERROR_MESSAGES.EMAIL_ALREADY_EXISTS);
    }

    const hashedPassword = await HashHelper.hash(createUserDto.password);
    const user = await this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    return {
      success: true,
      message: SUCCESS_MESSAGES.USER_CREATED,
      data: user,
    };
  }

  async findAll() {
    const users = await this.usersRepository.findAll();
    return {
      success: true,
      message: SUCCESS_MESSAGES.USERS_FETCHED,
      data: users,
    };
  }

  async findById(id: string) {
    const user = await this.usersRepository.findById(id);

    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    return {
      success: true,
      message: SUCCESS_MESSAGES.USER_FETCHED,
      data: user,
    };
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.usersRepository.findById(id);

    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    const updatedUser = await this.usersRepository.update(id, updateUserDto);

    return {
      success: true,
      message: SUCCESS_MESSAGES.USER_UPDATED,
      data: updatedUser,
    };
  }

  async delete(id: string) {
    const user = await this.usersRepository.findById(id);

    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    await this.usersRepository.delete(id);

    return {
      success: true,
      message: SUCCESS_MESSAGES.USER_DELETED,
    };
  }
}