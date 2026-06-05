import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { getPool, createTestTenant, cleanupTenant, TestUser } from './helpers/setup';
import pg from 'pg';

const CNPJ = '10000000000004';

describe('E2E — Assinaturas Eletrônicas', () => {
  let pool: pg.Pool;
  let admin: TestUser;
  let contractUuid: string;
  let signatureToken: string;

  beforeAll(async () => {
    pool = getPool();
    admin = await createTestTenant(pool, CNPJ, CNPJ);

    // Cria contrato base para testar assinaturas
    const contractRes = await request(app)
      .post('/v1/contracts')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        title: 'Contrato para Assinatura E2E',
        type: 'SERVICO',
        relatedParty: 'Assinante Teste',
        relatedPartyEmail: 'assinante@test.com',
        value: 5000.0,
        startDate: '2025-01-01T00:00:00.000Z',
        endDate: '2025-12-31T00:00:00.000Z',
        body: 'Corpo do contrato para assinatura eletrônica.',
      });

    contractUuid = contractRes.body.uuid;
  });

  afterAll(async () => {
    await cleanupTenant(pool, CNPJ);
    await pool.end();
  });

  it('POST /v1/contracts/:uuid/signature-request → 400 sem channel', async () => {
    const res = await request(app)
      .post(`/v1/contracts/${contractUuid}/signature-request`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('canal');
  });

  it('POST /v1/contracts/:uuid/signature-request → 200 solicita assinatura via LINK', async () => {
    const res = await request(app)
      .post(`/v1/contracts/${contractUuid}/signature-request`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        channel: 'LINK',
        expires_in_days: 7,
      });
    if (res.status === 500) console.log("500 ERROR BODY:", res.body || res.text);
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.signatureUrl).toBeDefined();
    signatureToken = res.body.token;
  });

  it('GET /v1/sign/:token → 200 valida token público', async () => {
    const res = await request(app).get(`/v1/sign/${signatureToken}`);
    expect(res.status).toBe(200);
    expect(res.body.contract).toBeDefined();
    expect(res.body.contract.title).toBe('Contrato para Assinatura E2E');
    expect(res.body.request.status).toBe('ENVIADO');
  });

  it('GET /v1/sign/token-invalido → 404 ou 400', async () => {
    const res = await request(app).get('/v1/sign/token-completamente-invalido-xyz');
    expect([400, 404]).toContain(res.status);
  });

  it('POST /v1/sign/:token → 400 sem nome do assinante', async () => {
    const res = await request(app)
      .post(`/v1/sign/${signatureToken}`)
      .send({});
    expect([400, 422]).toContain(res.status);
  });

  it('POST /v1/sign/:token → 200 assina contrato eletrônico', async () => {
    const res = await request(app)
      .post(`/v1/sign/${signatureToken}`)
      .send({ name: 'João Assinante da Silva' });
    expect(res.status).toBe(200);
    expect(res.body.message).toContain('sucesso');
  });

  it('POST /v1/sign/:token → 400/409 token já utilizado', async () => {
    const res = await request(app)
      .post(`/v1/sign/${signatureToken}`)
      .send({ name: 'João Assinante da Silva' });
    expect([400, 409, 422]).toContain(res.status);
  });

  it('Contrato muda status para ASSINADO após assinatura (trigger)', async () => {
    const res = await request(app)
      .get(`/v1/contracts/${contractUuid}`)
      .set('Authorization', `Bearer ${admin.token}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ASSINADO');
  });
});
