import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../infrastructure/users.repository';
import { createHash } from 'crypto';

@Injectable()
export class UsersService {
  constructor(private usersRepository: UsersRepository) {}

  createUser(userData: { email: string; login: string; passwordHash: string }) {
    return this.usersRepository.createUser(userData);
  }

  hhashPassword(password: string): string {
    return createHash('sha256').update(password).digest('hex');
  }

  findAll() {
    return this.usersRepository.findAll();
  }

  findById(id: string) {
    return this.usersRepository.findById(id);
  }

  deleteById(id: string) {
    return this.usersRepository.deleteById(id);
  }

  hashPassword(password: string): string {
    return createHash('sha256').update(password).digest('hex');
  }

  createUserWithPassword(body: {
    email: string;
    login: string;
    password: string;
  }) {
    console.log('Received body:', body);
    const passwordHash = this.hashPassword(body.password);
    return this.createUser({
      email: body.email,
      login: body.login,
      passwordHash,
    });
  }
}
