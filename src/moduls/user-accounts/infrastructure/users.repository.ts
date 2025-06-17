import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class UsersRepository {
  constructor(private dataSource: DataSource) {}

  async findByLoginOrEmail(loginOrEmail: string): Promise<any> {
    const result = await this.dataSource.query(
      `SELECT * FROM users 
       WHERE login = $1 OR email = $1 
       AND deletion_status IS DISTINCT FROM 'deleted'`,
      [loginOrEmail],
    );
    return result[0] || null;
  }

  async createUser(userData: {
    login: string;
    email: string;
    password_hash: string;
    confirmation_code: string;
    is_email_confirmed: boolean;
  }) {
    const result = await this.dataSource.query(
      `INSERT INTO users 
       (login, email, password_hash, confirmation_code, is_email_confirmed, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id, login, email, created_at`,
      [
        userData.login,
        userData.email,
        userData.password_hash,
        userData.confirmation_code,
        userData.is_email_confirmed,
      ],
    );
    return result[0];
  }

  async findAll(): Promise<any[]> {
    const query = `SELECT *
                   FROM users;`;
    return this.dataSource.query(query);
  }

  async findById(id: string): Promise<any> {
    const query = `SELECT *
                   FROM users
                   WHERE id = $1;`;
    const result = await this.dataSource.query(query, [id]);
    return result[0];
  }

  async deleteById(id: string): Promise<void> {
    const query = `DELETE
                   FROM users
                   WHERE id = $1;`;
    await this.dataSource.query(query, [id]);
  }

  async findByLogin(login: string): Promise<any | null> {
    const result = await this.dataSource.query(
      `SELECT *
       FROM users
       WHERE login = $1`,
      [login],
    );
    return result[0] || null;
  }

  async findByEmail(email: string): Promise<any | null> {
    const result = await this.dataSource.query(
      `SELECT * FROM users WHERE email = $1`,
      [email],
    );
    return result[0] || null; // ← Добавь эту строку
  }
}
