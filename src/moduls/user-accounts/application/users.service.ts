import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from '../infrastructure/users.repository';
import { createHash } from 'crypto';
import { DataSource } from 'typeorm';
import { GetUsersQueryDto } from '../dto/getUserQueryDto';

@Injectable()
export class UsersService {
  constructor(
    private usersRepository: UsersRepository,
    private readonly dataSource: DataSource,
  ) {}

  async createUser(userData: {
    email: string;
    login: string;
    passwordHash: string;
  }) {
    const query = `
    INSERT INTO users (email, login, password_hash, deletion_status, created_at, updated_at)
    VALUES ($1, $2, $3, 'active', now(), now())
    RETURNING id, login, email, created_at
  `;
    const params = [userData.email, userData.login, userData.passwordHash];
    const result = await this.dataSource.query(query, params);

    return {
      id: result[0].id,
      login: result[0].login,
      email: result[0].email,
      createdAt: result[0].created_at,
    };
  }

  async findAll(query: GetUsersQueryDto) {
    const page = query.pageNumber || 1;
    const size = query.pageSize || 10;
    const skip = (page - 1) * size;

    const sortBy = ['login', 'email', 'created_at'].includes(query.sortBy)
      ? query.sortBy
      : 'created_at';

    const sortDirection =
      query.sortDirection?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const params: any[] = [];
    let whereClause = "WHERE deletion_status = 'active'";
    const searchConditions: string[] = [];

    if (query.searchLoginTerm) {
      params.push(`%${query.searchLoginTerm.toLowerCase()}%`);
      searchConditions.push(`LOWER(login) LIKE $${params.length}`);
    }

    if (query.searchEmailTerm) {
      params.push(`%${query.searchEmailTerm.toLowerCase()}%`);
      searchConditions.push(`LOWER(email) LIKE $${params.length}`);
    }

    if (searchConditions.length > 0) {
      whereClause += ` AND (${searchConditions.join(' OR ')})`;
    }

    const sql = `
        SELECT id, login, email, created_at
        FROM users ${whereClause}
        ORDER BY ${sortBy} ${sortDirection}
  LIMIT $${params.length + 1}
        OFFSET $${params.length + 2}
    `;

    params.push(size, skip);

    const users = await this.dataSource.query(sql, params);

    // Подсчёт totalCount
    const countSql = `
        SELECT COUNT(*)
        FROM users ${whereClause}
    `;
    const countResult = await this.dataSource.query(
      countSql,
      params.slice(0, params.length - 2),
    );
    const totalCount = parseInt(countResult[0].count, 10);

    return {
      items: users,
      totalCount,
      page,
      size,
    };
  }
  findById(id: string) {
    return this.usersRepository.findById(id);
  }

  async deleteById(id: string) {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
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
