import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class AuthRepository {
  constructor(private dataSource: DataSource) {}

  async createUser(data: {
    login: string;
    email: string;
    password_hash: string;
    confirmationCode: string;
    isEmailConfirmed: boolean;
  }) {
    const result = await this.dataSource.query(
      `
          INSERT INTO users (login, email, password_hash, confirmation_code, is_email_confirmed, created_at)
          VALUES ($1, $2, $3, $4, $5, NOW())
              RETURNING *
      `,
      [
        data.login,
        data.email,
        data.password_hash,
        data.confirmationCode,
        data.isEmailConfirmed,
      ],
    );

    return result[0]; // возвращаем полный объект
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
