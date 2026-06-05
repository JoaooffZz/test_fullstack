import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { getPool, createTestTenant, cleanupTenant, TestUser } from './helpers/setup';
import pg from 'pg';

const CNPJ = '10000000000005';

describe('E2E — Obras (ciclo completo)', () => {
  let pool: pg.Pool;
  let admin: TestUser;
  let obraUuid: string;
  let stepUuid: string;
  let custoUuid: string;

  beforeAll(async () => {
    pool = getPool();
    admin = await createTestTenant(pool, CNPJ, CNPJ);
  });

  afterAll(async () => {
    await cleanupTenant(pool, CNPJ);
    await pool.end();
  });

  it('GET /v1/obras → 200 lista vazia', async () => {
    const res = await request(app)
      .get('/v1/obras')
      .set('Authorization', `Bearer ${admin.token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /v1/obras → 201 cria nova obra', async () => {
    const res = await request(app)
      .post('/v1/obras')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        name: 'Obra Residencial E2E',
        address: 'Rua das Flores, 123 - São Paulo/SP',
        description: 'Construção residencial de alto padrão.',
        startDate: '2025-03-01T00:00:00.000Z',
        endDate: '2025-12-31T00:00:00.000Z',
        budgetTotal: 500000.0,
        responsibleCnpj: '11222333000144',
      });
    expect(res.status).toBe(201);
    expect(res.body.uuid).toBeDefined();
    expect(res.body.name).toBe('Obra Residencial E2E');
    expect(res.body.status).toBe('PLANEJAMENTO');
    obraUuid = res.body.uuid;
  });

  it('GET /v1/obras → 200 lista com a obra criada', async () => {
    const res = await request(app)
      .get('/v1/obras')
      .set('Authorization', `Bearer ${admin.token}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it('GET /v1/obras/:uuid → 200 detalhes com steps e custos', async () => {
    const res = await request(app)
      .get(`/v1/obras/${obraUuid}`)
      .set('Authorization', `Bearer ${admin.token}`);
    expect(res.status).toBe(200);
    expect(res.body.uuid).toBe(obraUuid);
    expect(Array.isArray(res.body.steps)).toBe(true);
    expect(res.body.steps.length).toBeGreaterThanOrEqual(1);
    stepUuid = res.body.steps[0].uuid;
  });

  it('PATCH /v1/obras/:uuid/steps/:step_uuid → 200 atualiza etapa para CONCLUIDA', async () => {
    const res = await request(app)
      .patch(`/v1/obras/${obraUuid}/steps/${stepUuid}`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ status: 'CONCLUIDA' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('CONCLUIDA');
  });

  it('POST /v1/obras/:uuid/vistorias → 201 registra vistoria', async () => {
    const res = await request(app)
      .post(`/v1/obras/${obraUuid}/vistorias`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        type: 'INICIAL',
        description: 'Vistoria inicial da obra para verificação das condições do terreno.',
      });
    expect(res.status).toBe(201);
    expect(res.body.uuid).toBeDefined();
    expect(res.body.type).toBe('INICIAL');
  });

  it('POST /v1/obras/:uuid/costs → 201 lança custo na obra', async () => {
    const res = await request(app)
      .post(`/v1/obras/${obraUuid}/costs`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        description: 'Compra de cimento e areia',
        category: 'MATERIAL',
        value: 12500.5,
        date: '2025-04-15T00:00:00.000Z',
      });
    expect(res.status).toBe(201);
    expect(res.body.uuid).toBeDefined();
    expect(res.body.value).toBe(12500.5);
    expect(res.body.category).toBe('MATERIAL');
    custoUuid = res.body.uuid;
  });

  it('GET /v1/obras/:uuid → 200 totalSpent reflete o custo adicionado', async () => {
    const res = await request(app)
      .get(`/v1/obras/${obraUuid}`)
      .set('Authorization', `Bearer ${admin.token}`);
    expect(res.status).toBe(200);
    // totalSpent deve ser >= 12500.5
    const total = Number(res.body.totalSpent ?? res.body.total_spent ?? 0);
    expect(total).toBeGreaterThanOrEqual(12500.5);
  });

  it('POST /v1/obras/:uuid/costs → 201 segundo custo de mão de obra', async () => {
    const res = await request(app)
      .post(`/v1/obras/${obraUuid}/costs`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        description: 'Pagamento de pedreiros – Semana 1',
        category: 'MAO_DE_OBRA',
        value: 8000.0,
        date: '2025-04-18T00:00:00.000Z',
      });
    expect(res.status).toBe(201);
  });

  it('DELETE /v1/obras/:uuid/costs/:cost_uuid → 204 remove custo', async () => {
    const res = await request(app)
      .delete(`/v1/obras/${obraUuid}/costs/${custoUuid}`)
      .set('Authorization', `Bearer ${admin.token}`);
    expect(res.status).toBe(204);
  });

  it('GET /v1/obras/:uuid → 200 totalSpent atualizado após deleção do custo', async () => {
    const res = await request(app)
      .get(`/v1/obras/${obraUuid}`)
      .set('Authorization', `Bearer ${admin.token}`);
    expect(res.status).toBe(200);
    // Agora totalSpent deve ser só ~8000 (não mais 12500.5)
    const total = Number(res.body.totalSpent ?? res.body.total_spent ?? 0);
    expect(total).toBeGreaterThanOrEqual(8000);
    expect(total).toBeLessThan(20000);
  });

  it('PATCH /v1/obras/:uuid → 200 atualiza dados da obra', async () => {
    const res = await request(app)
      .patch(`/v1/obras/${obraUuid}`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        name: 'Obra Residencial E2E - Atualizada',
        description: 'Descrição atualizada via teste E2E.',
        status: 'EM_EXECUCAO',
      });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Obra Residencial E2E - Atualizada');
    expect(res.body.status).toBe('EM_EXECUCAO');
  });

  it('GET /v1/obras?status=EM_EXECUCAO → 200 filtra por status', async () => {
    const res = await request(app)
      .get('/v1/obras?status=EM_EXECUCAO')
      .set('Authorization', `Bearer ${admin.token}`);
    expect(res.status).toBe(200);
    expect(res.body.every((o: any) => o.status === 'EM_EXECUCAO')).toBe(true);
  });

  it('GET /v1/obras/:uuid (não pertence ao tenant) → 404', async () => {
    const res = await request(app)
      .get('/v1/obras/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${admin.token}`);
    expect(res.status).toBe(404);
  });
});
