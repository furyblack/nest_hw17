import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import * as bcrypt from 'bcrypt';
import cookieParser from 'cookie-parser';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // 👇 Вот это надо ДО app.init()
    app.use(cookieParser());

    await app.init();

    dataSource = moduleFixture.get(DataSource);

    await dataSource.query(`DELETE FROM sessions`);
    await dataSource.query(`DELETE FROM users`);

    const passwordHash = await bcrypt.hash('qwerty', 10);
    const userId = '11111111-1111-1111-1111-111111111111';

    await dataSource.query(
      `INSERT INTO users (id, login, email, password_hash, is_email_confirmed, deletion_status)
       VALUES ($1, $2, $3, $4, true, 'active')`,
      [userId, 'admin', 'admin@example.com', passwordHash],
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('Login should return accessToken and set refreshToken cookie', async () => {
    const loginDto = {
      loginOrEmail: 'admin',
      password: 'qwerty',
    };

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .set('User-Agent', 'TestAgent')
      .set('X-Forwarded-For', '127.0.0.1')
      .send(loginDto)
      .expect(200);

    expect(response.body.accessToken).toBeDefined();
    const setCookie = response.headers['set-cookie'];
    expect(setCookie).toBeDefined();
    expect(setCookie[0]).toMatch(/refreshToken/);

    // Проверим что сессия в БД появилась
    const sessions = await dataSource.query(`SELECT * FROM sessions`);

    // Нормализация IP-адреса
    const normalizeIp = (ip: string) =>
      ip === '::1' || ip === '::ffff:127.0.0.1' ? '127.0.0.1' : ip;

    expect(sessions.length).toBe(1);
    expect(normalizeIp(sessions[0].ip)).toBe('127.0.0.1');
    expect(sessions[0].title).toBe('TestAgent');
  });

  it('Refresh-token should return new access and refresh tokens', async () => {
    const loginDto = {
      loginOrEmail: 'admin',
      password: 'qwerty',
    };

    // Сначала логинимся
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .set('User-Agent', 'TestAgent')
      .set('X-Forwarded-For', '127.0.0.1')
      .send(loginDto)
      .expect(200);

    const cookies = loginResponse.headers['set-cookie'];
    expect(cookies).toBeDefined();

    const rawRefreshCookie = Array.isArray(cookies)
      ? cookies.find((cookie) => cookie.startsWith('refreshToken='))
      : cookies;

    expect(rawRefreshCookie).toBeDefined();

    const rawTokenString = rawRefreshCookie.split(';')[0]; // "refreshToken=..."
    expect(rawTokenString.startsWith('refreshToken=')).toBe(true);

    const refreshTokenValue = rawTokenString.split('=')[1];
    expect(refreshTokenValue).toBeDefined();

    const oldRefreshTokenCookie = rawTokenString;

    const refreshResponse = await request(app.getHttpServer())
      .post('/auth/refresh-token')
      .set('Cookie', [`refreshToken=${refreshTokenValue}`]) // ✅ важное изменение
      .expect(200);

    expect(refreshResponse.body.accessToken).toBeDefined();

    const newCookies = refreshResponse.headers['set-cookie'];
    expect(newCookies).toBeDefined();

    const newRefreshTokenCookie = Array.isArray(newCookies)
      ? newCookies.find((cookie) => cookie.startsWith('refreshToken'))
      : newCookies;

    expect(newRefreshTokenCookie).toBeDefined();
    expect(newRefreshTokenCookie).not.toBe(oldRefreshTokenCookie); // теперь есть old
  });
});
