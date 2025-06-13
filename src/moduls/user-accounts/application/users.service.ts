import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../infrastructure/users.repository';

@Injectable()
export class UsersService {
  constructor(private usersRepository: UsersRepository) {}

  createUser(userData: { email: string; login: string; passwordHash: string }) {
    return this.usersRepository.createUser(userData);
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
}
