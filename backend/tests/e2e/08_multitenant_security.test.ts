import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { getPool, createTestTenant, cleanupTenant, TestUser } from './helpers/setup';
import pg from 'pg';

/**
 * Testes de isolamento multi-tenant para TODOS os módulos.
 * Garante que os dados de uma empresa NUNCA aparecem para outra.
 */

const CNPJ_A = '20000000000001';
const CNPJ_B = '20000000000002';

describe('E2E — Multi-tenant Isolation (segurança)', () => {
  let pool: pg.Pool;
  let tenantA: TestUser;
  let tenantB: TestUser;
  let contractUuidA: string;
  let obraUuidA: string;
  let orderUuidA: string;
  let templateUuidA: string;

  beforeAll(async () => {
    pool = getPool();
    [tenantA, tenantB] = await Promise.all([
      createTestTenant(pool, CNPJ_A, CNPJ_A),
      createTestTenant(pool, CNPJ_B, CNPJ_B),
    ]);

    // Popula tenant A com dados
    const [tmplRes, contractRes, obraRes] = await Promise.all([
      request(app)
        .post('/v1/contract-templates')
        .set('Authorization', `Bearer ${tenantA.token}`)
        .send({
          name: 'Template Tenant A',
          type: 'SERVICO',
          body: 'Corpo do template do tenant A.',
        }),
      request(app)
        .post('/v1/contracts')
        .set('Authorization', `Bearer ${tenantA.token}`)
        .send({
          title: 'Contrato Secreto do Tenant A',
          type: 'SERVICO',
          relatedParty: 'Parceiro A',
          relatedPartyEmail: 'a@parceiro.com',
          value: 99999,
          startDate: '2025-01-01T00:00:00.000Z',
          endDate: '2025-12-31T00:00:00.000Z',
          body: 'Conteúdo sigiloso do tenant A.',
        }),
      request(app)
        .post('/v1/obras')
        .set('Authorization', `Bearer ${tenantA.token}`)
        .send({
          name: 'Obra Sigilosa Tenant A',
          address: 'Endereço A, 1',
          budgetTotal: 1000000,
          responsibleCnpj: '11111111000111',
        }),
    ]);

    templateUuidA = tmplRes.body.uuid;
    contractUuidA = contractRes.body.uuid;
    obraUuidA = obraRes.body.uuid;

    // Cria OC para tenant A
    const orderRes = await request(app)
      .post('/v1/purchase-orders')
      .set('Authorization', `Bearer ${tenantA.token}`)
      .send({
        obra_uuid: obraUuidA,
        supplier_name: 'Fornecedor Secreto A',
        supplier_cnpj: '22222222000122',
        payer_cnpj: CNPJ_A,
        delivery_date: '2025-06-01T00:00:00.000Z',
        items: [{ description: 'Item A', unit: 'un', quantity: 1, unit_price: 100 }],
      });
    orderUuidA = orderRes.body.uuid;
  });

  afterAll(async () => {
    await Promise.all([
      cleanupTenant(pool, CNPJ_A),
      cleanupTenant(pool, CNPJ_B),
    ]);
    await pool.end();
  });

  // Tenant B não vê templates do Tenant A
  it('Templates: Tenant B NÃO lista templates do Tenant A', async () => {
    const res = await request(app)
      .get('/v1/contract-templates')
      .set('Authorization', `Bearer ${tenantB.token}`);
    expect(res.status).toBe(200);
    const hasTemplateA = res.body.some((t: any) => t.uuid === templateUuidA);
    expect(hasTemplateA).toBe(false);
  });

  it('Templates: Tenant B NÃO acessa template do Tenant A por UUID', async () => {
    const res = await request(app)
      .get(`/v1/contract-templates/${templateUuidA}`)
      .set('Authorization', `Bearer ${tenantB.token}`);
    expect(res.status).toBe(404);
  });

  // Tenant B não vê contratos do Tenant A
  it('Contratos: Tenant B NÃO lista contratos do Tenant A', async () => {
    const res = await request(app)
      .get('/v1/contracts')
      .set('Authorization', `Bearer ${tenantB.token}`);
    expect(res.status).toBe(200);
    const contracts = res.body.data ?? res.body;
    const hasContractA = contracts.some((c: any) => c.uuid === contractUuidA);
    expect(hasContractA).toBe(false);
  });

  it('Contratos: Tenant B NÃO acessa contrato do Tenant A por UUID', async () => {
    const res = await request(app)
      .get(`/v1/contracts/${contractUuidA}`)
      .set('Authorization', `Bearer ${tenantB.token}`);
    expect([403, 404]).toContain(res.status);
  });

  it('Contratos: Tenant B NÃO pode encerrar contrato do Tenant A', async () => {
    const res = await request(app)
      .patch(`/v1/contracts/${contractUuidA}/close`)
      .set('Authorization', `Bearer ${tenantB.token}`)
      .send({ close_reason: 'Tentativa de ataque cross-tenant' });
    expect([403, 404]).toContain(res.status);
  });

  // Tenant B não vê obras do Tenant A
  it('Obras: Tenant B NÃO lista obras do Tenant A', async () => {
    const res = await request(app)
      .get('/v1/obras')
      .set('Authorization', `Bearer ${tenantB.token}`);
    expect(res.status).toBe(200);
    const hasObraA = res.body.some((o: any) => o.uuid === obraUuidA);
    expect(hasObraA).toBe(false);
  });

  it('Obras: Tenant B NÃO acessa obra do Tenant A por UUID', async () => {
    const res = await request(app)
      .get(`/v1/obras/${obraUuidA}`)
      .set('Authorization', `Bearer ${tenantB.token}`);
    expect([403, 404]).toContain(res.status);
  });

  it('Obras: Tenant B NÃO pode adicionar custo em obra do Tenant A', async () => {
    const res = await request(app)
      .post(`/v1/obras/${obraUuidA}/costs`)
      .set('Authorization', `Bearer ${tenantB.token}`)
      .send({
        description: 'Custo injetado',
        category: 'MATERIAL',
        value: 9999999,
        date: '2025-01-01T00:00:00.000Z',
      });
    expect([403, 404]).toContain(res.status);
  });

  // Tenant B não vê OCs do Tenant A
  it('OCs: Tenant B NÃO lista ordens de compra do Tenant A', async () => {
    const res = await request(app)
      .get('/v1/purchase-orders')
      .set('Authorization', `Bearer ${tenantB.token}`);
    expect(res.status).toBe(200);
    const hasOrderA = res.body.some((o: any) => o.uuid === orderUuidA);
    expect(hasOrderA).toBe(false);
  });

  it('OCs: Tenant B NÃO acessa OC do Tenant A por UUID', async () => {
    const res = await request(app)
      .get(`/v1/purchase-orders/${orderUuidA}`)
      .set('Authorization', `Bearer ${tenantB.token}`);
    expect([403, 404]).toContain(res.status);
  });

  it('OCs: Tenant B NÃO pode alterar status de OC do Tenant A', async () => {
    const res = await request(app)
      .patch(`/v1/purchase-orders/${orderUuidA}/status`)
      .set('Authorization', `Bearer ${tenantB.token}`)
      .send({ status: 'CANCELADO' });
    expect([403, 404]).toContain(res.status);
  });

  // Relatórios isolados
  it('Relatórios: Tenant B vê apenas seus contratos (0 do Tenant A)', async () => {
    const res = await request(app)
      .get('/v1/reports/contracts')
      .set('Authorization', `Bearer ${tenantB.token}`);
    expect(res.status).toBe(200);
    const hasContractA = res.body.some((c: any) => c.uuid === contractUuidA);
    expect(hasContractA).toBe(false);
  });

  it('Relatórios: Tenant B vê apenas suas obras (0 do Tenant A)', async () => {
    const res = await request(app)
      .get('/v1/reports/obras')
      .set('Authorization', `Bearer ${tenantB.token}`);
    expect(res.status).toBe(200);
    const hasObraA = res.body.some((o: any) => o.uuid === obraUuidA || o.name === 'Obra Sigilosa Tenant A');
    expect(hasObraA).toBe(false);
  });

  // Dashboard isolado
  it('Dashboard: Tenant B vê métricas zeradas (não vaza dados do Tenant A)', async () => {
    const res = await request(app)
      .get('/v1/dashboard')
      .set('Authorization', `Bearer ${tenantB.token}`);
    expect(res.status).toBe(200);

    const metrics = res.body;
    const contractCount =
      metrics.totalContracts ??
      metrics.activeContracts ??
      metrics.contracts?.total ??
      0;
    expect(Number(contractCount)).toBe(0);
  });
});
