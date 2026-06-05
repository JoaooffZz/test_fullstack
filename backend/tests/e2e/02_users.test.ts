import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { getPool, createTestTenant, cleanupTenant, TestUser } from './helpers/setup';
import pg from 'pg';

const CNPJ = '10000000000002';

describe('E2E — Usuários', () => {
  let pool: pg.Pool;
  let admin: TestUser;

  beforeAll(async () => {
    pool = getPool();
    admin = await createTestTenant(pool, CNPJ, CNPJ);
  });

  afterAll(async () => {
    await cleanupTenant(pool, CNPJ);
    await pool.end();
  });

  it('GET /v1/users/me → 200 com dados do usuário autenticado', async () => {
    const res = await request(app)
      .get('/v1/users/me')
      .set('Authorization', `Bearer ${admin.token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(admin.email);
  });

  it('POST /v1/users → 201 criando novo usuário pela empresa', async () => {
    const res = await request(app)
      .post('/v1/users')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        name: 'Editor Teste',
        email: `e2e_editor_${CNPJ}@test.com`,
        password: 'Password123!',
        role: 'EDITOR',
      });
    expect(res.status).toBe(201);
    expect(res.body.email).toBe(`e2e_editor_${CNPJ}@test.com`);
    expect(res.body.role).toBe('EDITOR');
  });

  it('GET /v1/users → 200 listando usuários da empresa', async () => {
    const res = await request(app)
      .get('/v1/users')
      .set('Authorization', `Bearer ${admin.token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2); // admin + editor
  });
});
