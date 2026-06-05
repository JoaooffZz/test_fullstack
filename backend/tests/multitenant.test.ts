import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/test_db';

describe('Multi-Tenancy Isolation', () => {
  let pool: pg.Pool;
  let tokenA: string;
  let tokenB: string;
  let contractUuidA: string;
  let obraUuidA: string;

  beforeAll(async () => {
    pool = new pg.Pool({ connectionString });

    // Setup Empresa A e B
    await pool.query(`DELETE FROM users WHERE email IN ('admina@tenant.com', 'adminb@tenant.com')`);
    await pool.query(`DELETE FROM companies WHERE cnpj IN ('11111111111111', '22222222222222')`);

    // Registrar Empresa A
    const regA = await request(app).post('/v1/auth/register').send({
      companyName: 'Empresa A',
      cnpj: '11111111111111',
      userName: 'Admin A',
      email: 'admina@tenant.com',
      password: 'Password123!',
    });
    tokenA = (await request(app).post('/v1/auth/login').send({ email: 'admina@tenant.com', password: 'Password123!' })).body.token;

    // Registrar Empresa B
    const regB = await request(app).post('/v1/auth/register').send({
      companyName: 'Empresa B',
      cnpj: '22222222222222',
      userName: 'Admin B',
      email: 'adminb@tenant.com',
      password: 'Password123!',
    });
    tokenB = (await request(app).post('/v1/auth/login').send({ email: 'adminb@tenant.com', password: 'Password123!' })).body.token;

    // Criar Contrato na Empresa A
    const contractRes = await request(app)
      .post('/v1/contracts')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        title: 'Contrato Secreto A',
        type: 'OBRA',
        relatedParty: 'Fornecedor A',
        relatedPartyEmail: 'forn@a.com',
        body: 'Texto sigiloso da Empresa A',
        value: 100000,
      });
    contractUuidA = contractRes.body.uuid;

    // Criar Obra na Empresa A
    const obraRes = await request(app)
      .post('/v1/obras')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: 'Obra Confidencial A',
        address: 'Rua A',
        budgetTotal: 1000000,
      });
    obraUuidA = obraRes.body.uuid;
  });

  afterAll(async () => {
    // Limpar tudo
    await pool.query(`DELETE FROM purchase_orders WHERE company_uuid IN (SELECT uuid FROM companies WHERE cnpj IN ('11111111111111', '22222222222222'))`);
    await pool.query(`DELETE FROM contracts WHERE company_uuid IN (SELECT uuid FROM companies WHERE cnpj IN ('11111111111111', '22222222222222'))`);
    await pool.query(`DELETE FROM obras WHERE company_uuid IN (SELECT uuid FROM companies WHERE cnpj IN ('11111111111111', '22222222222222'))`);
    await pool.query(`DELETE FROM users WHERE email IN ('admina@tenant.com', 'adminb@tenant.com')`);
    await pool.query(`DELETE FROM companies WHERE cnpj IN ('11111111111111', '22222222222222')`);
    await pool.end();
  });

  it('deve listar arrays vazios de contratos/obras para a Empresa B', async () => {
    const listContracts = await request(app)
      .get('/v1/contracts')
      .set('Authorization', `Bearer ${tokenB}`);

    expect(listContracts.status).toBe(200);
    expect(listContracts.body.data).toHaveLength(0); // B não deve ver os contratos de A

    const listObras = await request(app)
      .get('/v1/obras')
      .set('Authorization', `Bearer ${tokenB}`);

    expect(listObras.status).toBe(200);
    expect(listObras.body).toHaveLength(0); // B não deve ver as obras de A
  });

  it('deve retornar 404 ao tentar detalhar um contrato ou obra da Empresa A utilizando o token da Empresa B', async () => {
    const getContract = await request(app)
      .get(`/v1/contracts/${contractUuidA}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(getContract.status).toBe(404);

    const getObra = await request(app)
      .get(`/v1/obras/${obraUuidA}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(getObra.status).toBe(404);
  });
});
