import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class UsersRepository {
  constructor(private dataSource: DataSource) {}

  async createUser(userData: {
    email: string;
    login: string;
    passwordHash: string;
  }): Promise<any> {
    const query = `
        INSERT INTO users (email, login, password_hash, is_email_confirmed, deletion_status, created_at, updated_at)
        VALUES ($1, $2, $3, false, 'active', now(), now())
            RETURNING *;
    `;

    const params = [userData.email, userData.login, userData.passwordHash];

    const result = await this.dataSource.query(query, params);
    return result[0];
  }

  async findAll(): Promise<any[]> {
    const query = `SELECT * FROM users;`;
    return this.dataSource.query(query);
  }

  async findById(id: string): Promise<any> {
    const query = `SELECT * FROM users WHERE id = $1;`;
    const result = await this.dataSource.query(query, [id]);
    return result[0];
  }

  async deleteById(id: string): Promise<void> {
    const query = `DELETE FROM users WHERE id = $1;`;
    await this.dataSource.query(query, [id]);
  }
}
