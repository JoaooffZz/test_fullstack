import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { getPool, createTestTenant, cleanupTenant, TestUser } from './helpers/setup';
import pg from 'pg';

const CNPJ = '10000000000001';

describe('E2E — Health & Auth', () => {
  let pool: pg.Pool;

  beforeAll(async () => {
    pool = getPool();
  });

  afterAll(async () => {
    await cleanupTenant(pool, CNPJ);
    await pool.end();
  });

  it('GET /health → 200 { status: OK }', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('OK');
  });

  it('POST /v1/auth/register → 400 com payload inválido', async () => {
    const res = await request(app).post('/v1/auth/register').send({
      companyName: 'X',
      cnpj: '123', // muito curto
      userName: 'A',
      email: 'invalido',
      password: '123',
    });
    expect(res.status).toBe(400);
  });

  it('POST /v1/auth/register → 201 com dados válidos', async () => {
    await pool.query(`DELETE FROM companies WHERE cnpj = $1`, [CNPJ]);
    const res = await request(app).post('/v1/auth/register').send({
      companyName: 'Auth E2E Company',
      cnpj: CNPJ,
      userName: 'Admin E2E',
      email: `e2e_admin_${CNPJ}@test.com`,
      password: 'Password123!',
    });
    expect(res.status).toBe(201);
    expect(res.body.message).toBeDefined();
  });

  it('POST /v1/auth/login → 401 com senha errada', async () => {
    const res = await request(app).post('/v1/auth/login').send({
      email: `e2e_admin_${CNPJ}@test.com`,
      password: 'SenhaErrada!',
    });
    expect(res.status).toBe(401);
  });

  it('POST /v1/auth/login → 200 com token JWT', async () => {
    const res = await request(app).post('/v1/auth/login').send({
      email: `e2e_admin_${CNPJ}@test.com`,
      password: 'Password123!',
    });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe(`e2e_admin_${CNPJ}@test.com`);
  });

  it('Rota protegida → 401 sem token', async () => {
    const res = await request(app).get('/v1/users/me');
    expect(res.status).toBe(401);
  });
});
