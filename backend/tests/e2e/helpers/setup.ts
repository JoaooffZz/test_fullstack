/**
 * Utilitários de setup compartilhados por toda a suite de testes E2E.
 * Responsável por criar/remover fixtures de banco de dados e obter tokens JWT.
 */

import request from 'supertest';
import pg from 'pg';
import { app } from '../../../src/app';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/test_db';

export function getPool(): pg.Pool {
  return new pg.Pool({ connectionString });
}

export interface TestUser {
  companyUuid: string;
  userUuid: string;
  token: string;
  email: string;
  cnpj: string;
}

export async function createTestTenant(pool: pg.Pool, cnpj: string, emailSuffix: string): Promise<TestUser> {
  const companyName = `E2E Test Company ${cnpj}`;
  const email = `e2e_admin_${emailSuffix}@test.com`;

  // Clean up any leftover from previous run
  await pool.query(`DELETE FROM users WHERE email = $1`, [email]);
  await pool.query(`DELETE FROM companies WHERE cnpj = $1`, [cnpj]);

  const regRes = await request(app).post('/v1/auth/register').send({
    companyName,
    cnpj,
    userName: `Admin ${cnpj}`,
    email,
    password: 'Password123!',
  });

  if (regRes.status !== 201) {
    throw new Error(`Failed to create test tenant ${cnpj}: ${JSON.stringify(regRes.body)}`);
  }

  const loginRes = await request(app)
    .post('/v1/auth/login')
    .send({ email, password: 'Password123!' });

  const { token } = loginRes.body;
  const companyRow = await pool.query(`SELECT uuid FROM companies WHERE cnpj = $1`, [cnpj]);
  const userRow = await pool.query(`SELECT uuid FROM users WHERE email = $1`, [email]);

  return {
    companyUuid: companyRow.rows[0].uuid,
    userUuid: userRow.rows[0].uuid,
    token,
    email,
    cnpj,
  };
}

export async function cleanupTenant(pool: pg.Pool, cnpj: string): Promise<void> {
  const companyRow = await pool.query(`SELECT uuid FROM companies WHERE cnpj = $1`, [cnpj]);
  if (companyRow.rows.length === 0) return;

  const companyUuid = companyRow.rows[0].uuid;

  await pool.query(`DELETE FROM signature_requests WHERE contract_uuid IN (SELECT uuid FROM contracts WHERE company_uuid = $1)`, [companyUuid]);
  await pool.query(`UPDATE contracts SET origin_contract_uuid = NULL WHERE company_uuid = $1`, [companyUuid]);
  await pool.query(`DELETE FROM uploads WHERE company_uuid = $1`, [companyUuid]);
  await pool.query(`DELETE FROM purchase_order_items WHERE purchase_order_uuid IN (SELECT uuid FROM purchase_orders WHERE company_uuid = $1)`, [companyUuid]);
  await pool.query(`DELETE FROM purchase_orders WHERE company_uuid = $1`, [companyUuid]);
  await pool.query(`DELETE FROM obra_vistorias WHERE obra_uuid IN (SELECT uuid FROM obras WHERE company_uuid = $1)`, [companyUuid]);
  await pool.query(`DELETE FROM obra_custos WHERE obra_uuid IN (SELECT uuid FROM obras WHERE company_uuid = $1)`, [companyUuid]);
  await pool.query(`DELETE FROM obra_steps WHERE obra_uuid IN (SELECT uuid FROM obras WHERE company_uuid = $1)`, [companyUuid]);
  await pool.query(`DELETE FROM obras WHERE company_uuid = $1`, [companyUuid]);
  await pool.query(`DELETE FROM contracts WHERE company_uuid = $1`, [companyUuid]);
  await pool.query(`DELETE FROM contract_templates WHERE company_uuid = $1`, [companyUuid]);
  await pool.query(`DELETE FROM users WHERE company_uuid = $1`, [companyUuid]);
  await pool.query(`DELETE FROM companies WHERE cnpj = $1`, [cnpj]);
}

export async function auth(token: string) {
  return { Authorization: `Bearer ${token}` };
}
