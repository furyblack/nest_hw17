import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class AuthRepository {
  constructor(private dataSource: DataSource) {}

  async createUser(userData: {
    login: string;
    email: string;
    passwordHash: string;
  }): Promise<{ id: string }> {
    const result = await this.dataSource.query(
      `
    INSERT INTO users (login, email, password_hash, deletion_status)
    VALUES ($1, $2, $3, $4)
    RETURNING id
    `,
      [userData.login, userData.email, userData.passwordHash, 'active'], // 'active' — пример
    );

    return result[0]; // вернется объект с id
  }

  async findUserByLoginOrEmail(loginOrEmail: string): Promise<any | null> {
    const result = await this.dataSource.query(
      `
      SELECT * FROM users
      WHERE login = $1 OR email = $1
      `,
      [loginOrEmail],
    );
    return result[0] || null;
  }
}
