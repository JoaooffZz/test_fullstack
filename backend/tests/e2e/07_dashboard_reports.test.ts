import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { getPool, createTestTenant, cleanupTenant, TestUser } from './helpers/setup';
import pg from 'pg';

const CNPJ = '10000000000007';

describe('E2E — Dashboard & Relatórios', () => {
  let pool: pg.Pool;
  let admin: TestUser;
  let obraUuid: string;

  beforeAll(async () => {
    pool = getPool();
    admin = await createTestTenant(pool, CNPJ, CNPJ);

    // Cria alguns contratos e obra para popular o dashboard
    await request(app)
      .post('/v1/contracts')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        title: 'Contrato Dashboard Ativo',
        type: 'SERVICO',
        relatedParty: 'Empresa A',
        relatedPartyEmail: 'a@empresa.com',
        value: 100000,
        startDate: '2025-01-01T00:00:00.000Z',
        endDate: '2025-12-31T00:00:00.000Z',
        body: 'Corpo de contrato para dashboard.',
      });

    const obraRes = await request(app)
      .post('/v1/obras')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        name: 'Obra Dashboard E2E',
        address: 'Rua Central, 100 - Brasília/DF',
        startDate: '2025-02-01T00:00:00.000Z',
        budgetTotal: 250000,
        responsibleCnpj: '77666555000188',
      });
    obraUuid = obraRes.body.uuid;

    // Adiciona custo para ter dados financeiros
    await request(app)
      .post(`/v1/obras/${obraUuid}/costs`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        description: 'Materiais iniciais',
        category: 'MATERIAL',
        value: 30000,
        date: '2025-03-01T00:00:00.000Z',
      });
  });

  afterAll(async () => {
    await cleanupTenant(pool, CNPJ);
    await pool.end();
  });

  // ── Dashboard ─────────────────────────────────────────────────────────────

  it('GET /v1/dashboard → 401 sem autenticação', async () => {
    const res = await request(app).get('/v1/dashboard');
    expect(res.status).toBe(401);
  });

  it('GET /v1/dashboard → 200 retorna métricas válidas', async () => {
    const res = await request(app)
      .get('/v1/dashboard')
      .set('Authorization', `Bearer ${admin.token}`);
    expect(res.status).toBe(200);

    // Verifica estrutura da resposta
    const metrics = res.body;
    expect(metrics).toBeDefined();

    // Esperado: métricas de contratos
    const hasContracts =
      'totalContracts' in metrics ||
      'contracts' in metrics ||
      'activeContracts' in metrics ||
      'contractsAtivos' in metrics;
    expect(hasContracts).toBe(true);

    // Esperado: métricas de obras
    const hasObras =
      'totalObras' in metrics ||
      'obras' in metrics ||
      'obrasAtivas' in metrics;
    expect(hasObras).toBe(true);
  });

  it('GET /v1/dashboard → dados isolados por empresa (multi-tenant)', async () => {
    // Cria um segundo tenant e verifica que o dashboard só mostra seus dados
    const otherCnpj = '10000000000072';
    const otherAdmin = await createTestTenant(pool, otherCnpj, otherCnpj);

    const res = await request(app)
      .get('/v1/dashboard')
      .set('Authorization', `Bearer ${otherAdmin.token}`);
    expect(res.status).toBe(200);

    // O segundo tenant não tem contratos nem obras, então métricas devem ser 0
    const metrics = res.body;
    const contractCount = 
      metrics.totalContracts ?? 
      metrics.activeContracts ?? 
      metrics.contracts?.total ?? 
      0;
    expect(Number(contractCount)).toBe(0);

    await cleanupTenant(pool, otherCnpj);
  });

  // ── Relatórios — Contratos ────────────────────────────────────────────────

  it('GET /v1/reports/contracts → 401 sem autenticação', async () => {
    const res = await request(app).get('/v1/reports/contracts');
    expect(res.status).toBe(401);
  });

  it('GET /v1/reports/contracts (JSON) → 200 retorna lista de contratos', async () => {
    const res = await request(app)
      .get('/v1/reports/contracts')
      .set('Authorization', `Bearer ${admin.token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it('GET /v1/reports/contracts?format=csv → 200 retorna CSV com BOM UTF-8', async () => {
    const res = await request(app)
      .get('/v1/reports/contracts?format=csv')
      .set('Authorization', `Bearer ${admin.token}`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.headers['content-disposition']).toContain('relatorio_contratos.csv');

    // Verifica BOM UTF-8 (primeiros 3 bytes: EF BB BF)
    const body = res.text;
    expect(body.charCodeAt(0)).toBe(0xFEFF); // BOM UTF-8 decoded to JavaScript string starts with 0xFEFF
    // Ao menos verifica que o conteúdo tem cabeçalhos em português
    expect(body).toContain('Título');
    expect(body).toContain('Status');
    expect(body).toContain('Contrato Dashboard Ativo');
  });

  it('GET /v1/reports/contracts?status=RASCUNHO → 200 filtra por status', async () => {
    const res = await request(app)
      .get('/v1/reports/contracts?status=RASCUNHO')
      .set('Authorization', `Bearer ${admin.token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    // Todos os contratos retornados devem ter status RASCUNHO
    if (res.body.length > 0) {
      expect(res.body.every((c: any) => c.status === 'RASCUNHO')).toBe(true);
    }
  });

  it('GET /v1/reports/contracts?type=SERVICO → 200 filtra por tipo', async () => {
    const res = await request(app)
      .get('/v1/reports/contracts?type=SERVICO')
      .set('Authorization', `Bearer ${admin.token}`);
    expect(res.status).toBe(200);
    if (res.body.length > 0) {
      expect(res.body.every((c: any) => c.type === 'SERVICO')).toBe(true);
    }
  });

  it('GET /v1/reports/contracts?start_date_from=2025-01-01 → 200 filtra por data', async () => {
    const res = await request(app)
      .get('/v1/reports/contracts?start_date_from=2025-01-01')
      .set('Authorization', `Bearer ${admin.token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // ── Relatórios — Obras ────────────────────────────────────────────────────

  it('GET /v1/reports/obras (JSON) → 200 retorna lista de obras', async () => {
    const res = await request(app)
      .get('/v1/reports/obras')
      .set('Authorization', `Bearer ${admin.token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);

    // Verifica estrutura de cada obra no relatório
    const obra = res.body[0];
    expect(obra).toHaveProperty('name');
    expect(obra).toHaveProperty('status');
  });

  it('GET /v1/reports/obras?format=csv → 200 retorna CSV de obras', async () => {
    const res = await request(app)
      .get('/v1/reports/obras?format=csv')
      .set('Authorization', `Bearer ${admin.token}`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.headers['content-disposition']).toContain('relatorio_obras.csv');

    const body = res.text;
    expect(body).toContain('Nome');
    expect(body).toContain('Status');
    expect(body).toContain('Obra Dashboard E2E');
  });

  it('GET /v1/reports/obras?status=EM_EXECUCAO → 200 filtra por status', async () => {
    const res = await request(app)
      .get('/v1/reports/obras?status=EM_EXECUCAO')
      .set('Authorization', `Bearer ${admin.token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('Relatórios são isolados por tenant', async () => {
    // Cria outro tenant sem dados e valida que relatório retorna vazio
    const otherCnpj = '10000000000073';
    const otherAdmin = await createTestTenant(pool, otherCnpj, otherCnpj);

    const res = await request(app)
      .get('/v1/reports/contracts')
      .set('Authorization', `Bearer ${otherAdmin.token}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(0);

    await cleanupTenant(pool, otherCnpj);
  });
});
