import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/test_db';

describe('Auth & User Routes', () => {
  let pool: pg.Pool;
  const testCnpj = '12345678901234';

  beforeAll(async () => {
    pool = new pg.Pool({ connectionString });
    // Limpar usuário de teste
    await pool.query(`DELETE FROM users WHERE email = $1`, ['test_user_auth@domain.com']);
    await pool.query(`DELETE FROM companies WHERE cnpj = $1`, [testCnpj]);
  });

  afterAll(async () => {
    await pool.query(`DELETE FROM users WHERE email = $1`, ['test_user_auth@domain.com']);
    await pool.query(`DELETE FROM companies WHERE cnpj = $1`, [testCnpj]);
    await pool.end();
  });

  it('deve falhar ao registrar com dados inválidos', async () => {
    const res = await request(app)
      .post('/v1/auth/register')
      .send({
        companyName: 'Empresa Teste',
        cnpj: '123', // inválido
        name: 'Nome Teste',
        email: 'email_invalido', // inválido
        password: '123', // inválida
      });

    expect(res.status).toBe(400);
  });

  it('deve registrar e autenticar um usuário com sucesso', async () => {
    // 1. Registro
    const registerRes = await request(app)
      .post('/v1/auth/register')
      .send({
        companyName: 'Empresa Teste Autenticacao',
        cnpj: testCnpj,
        userName: 'Admin Teste',
        email: 'test_user_auth@domain.com',
        password: 'Password123!',
      });

    expect(registerRes.status).toBe(201);
    expect(registerRes.body.message).toBeDefined();

    // 2. Login inválido
    const failLoginRes = await request(app)
      .post('/v1/auth/login')
      .send({
        email: 'test_user_auth@domain.com',
        password: 'SenhaIncorreta123',
      });

    expect(failLoginRes.status).toBe(401);

    // 3. Login com sucesso
    const loginRes = await request(app)
      .post('/v1/auth/login')
      .send({
        email: 'test_user_auth@domain.com',
        password: 'Password123!',
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body).toHaveProperty('token');
  });
});
