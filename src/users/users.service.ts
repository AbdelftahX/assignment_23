import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  private users: User[] = [];
  private nextId = 1;

  create(dto: CreateUserDto): User {
    if (this.users.some((u) => u.email === dto.email)) {
      throw new ConflictException('Email already exists');
    }
    const user: User = { id: this.nextId++, ...dto };
    this.users.push(user);
    return user;
  }

  findAll(username?: string): User[] {
    if (username) {
      return this.users.filter((u) =>
        u.username.includes(username.trim().toLowerCase()),
      );
    }
    return this.users;
  }

  findOne(id: number): User {
    const user = this.users.find((u) => u.id === id);
    if (!user) throw new NotFoundException(`User with id ${id} not found`);
    return user;
  }

  findByUsername(username: string): User {
    const user = this.users.find((u) => u.username === username);
    if (!user) throw new NotFoundException(`User '${username}' not found`);
    return user;
  }

  update(id: number, dto: UpdateUserDto): User {
    const user = this.findOne(id);
    Object.assign(user, dto);
    return user;
  }

  replace(id: number, dto: CreateUserDto): User {
    const index = this.users.findIndex((u) => u.id === id);
    if (index === -1) throw new NotFoundException(`User with id ${id} not found`);
    this.users[index] = { id, ...dto };
    return this.users[index];
  }

  remove(id: number): { message: string } {
    const user = this.findOne(id);
    this.users = this.users.filter((u) => u.id !== user.id);
    return { message: `User ${id} deleted successfully` };
  }
}
