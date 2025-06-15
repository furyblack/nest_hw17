import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from '../infrastructure/users.repository';
import { createHash } from 'crypto';
import { DataSource } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    private usersRepository: UsersRepository,
    private readonly dataSource: DataSource,
  ) {}

  createUser(userData: { email: string; login: string; passwordHash: string }) {
    return this.usersRepository.createUser(userData);
  }

  hhashPassword(password: string): string {
    return createHash('sha256').update(password).digest('hex');
  }

  async findAll(query: {
    sortBy: string;
    sortDirection: 'asc' | 'desc';
    pageNumber: number;
    pageSize: number;
    searchLoginTerm?: string;
    searchEmailTerm?: string;
  }): Promise<{
    items: any[];
    totalCount: number;
    page: number;
    size: number;
  }> {
    const {
      sortBy = 'created_at',
      sortDirection = 'desc',
      pageNumber = 1,
      pageSize = 10,
    } = query;
    const offset = (pageNumber - 1) * pageSize;

    const conditions: string[] = ["deletion_status = 'active'"];
    const params: any[] = [];
    let paramIndex = 1;

    if (query.searchLoginTerm) {
      conditions.push(`login ILIKE $${paramIndex}`);
      params.push(`%${query.searchLoginTerm}%`);
      paramIndex++;
    }

    if (query.searchEmailTerm) {
      conditions.push(`email ILIKE $${paramIndex}`);
      params.push(`%${query.searchEmailTerm}%`);
      paramIndex++;
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' OR ')}` : '';

    const dataQuery = `
    SELECT id, login, email, created_at
    FROM users
    ${whereClause}
    ORDER BY ${sortBy} ${sortDirection}
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

    params.push(pageSize, offset);

    const countQuery = `
    SELECT COUNT(*) FROM users
    ${whereClause}
  `;

    const [items, countResult] = await Promise.all([
      this.dataSource.query(dataQuery, params),
      this.dataSource.query(countQuery, params.slice(0, paramIndex - 1)),
    ]);
    console.log('RAW SQL ITEMS:', items);

    const totalCount = parseInt(countResult[0].count, 10);

    return {
      items: items.map((user) => ({
        id: user.id,
        login: user.login,
        email: user.email,
        createdAt: user.created_at,
      })),

      totalCount,
      page: pageNumber,
      size: pageSize,
    };
  }

  findById(id: string) {
    return this.usersRepository.findById(id);
  }

  deleteById(id: string) {
    const user = this.usersRepository.findById(id);
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
