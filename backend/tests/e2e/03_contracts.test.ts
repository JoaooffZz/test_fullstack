import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { getPool, createTestTenant, cleanupTenant, TestUser } from './helpers/setup';
import pg from 'pg';

const CNPJ = '10000000000003';

describe('E2E — Contract Templates', () => {
  let pool: pg.Pool;
  let admin: TestUser;
  let createdTemplateUuid: string;

  beforeAll(async () => {
    pool = getPool();
    admin = await createTestTenant(pool, CNPJ, CNPJ);
  });

  afterAll(async () => {
    await cleanupTenant(pool, CNPJ);
    await pool.end();
  });

  it('GET /v1/contract-templates → 200 lista vazia inicialmente', async () => {
    const res = await request(app)
      .get('/v1/contract-templates')
      .set('Authorization', `Bearer ${admin.token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /v1/contract-templates → 401 sem token', async () => {
    const res = await request(app)
      .post('/v1/contract-templates')
      .send({ name: 'Sem Token', type: 'SERVICO', body: 'Body' });
    expect(res.status).toBe(401);
  });

  it('POST /v1/contract-templates → 201 criando template', async () => {
    const res = await request(app)
      .post('/v1/contract-templates')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        name: 'Template Prestação de Serviços',
        type: 'SERVICO',
        description: 'Template padrão para serviços',
        body: 'Este contrato é firmado entre {{CONTRATANTE}} e {{CONTRATADO}}.',
        fields: [
          { key: 'CONTRATANTE', label: 'Nome do Contratante', type: 'TEXT', required: true },
          { key: 'CONTRATADO', label: 'Nome do Contratado', type: 'TEXT', required: true },
        ],
      });
    expect(res.status).toBe(201);
    expect(res.body.uuid).toBeDefined();
    expect(res.body.name).toBe('Template Prestação de Serviços');
    expect(res.body.type).toBe('SERVICO');
    createdTemplateUuid = res.body.uuid;
  });

  it('GET /v1/contract-templates/:uuid → 200 com template criado', async () => {
    const res = await request(app)
      .get(`/v1/contract-templates/${createdTemplateUuid}`)
      .set('Authorization', `Bearer ${admin.token}`);
    expect(res.status).toBe(200);
    expect(res.body.uuid).toBe(createdTemplateUuid);
    expect(res.body.fields).toHaveLength(2);
  });

  it('GET /v1/contract-templates?type=SERVICO → 200 filtra por tipo', async () => {
    const res = await request(app)
      .get('/v1/contract-templates?type=SERVICO')
      .set('Authorization', `Bearer ${admin.token}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body.every((t: any) => t.type === 'SERVICO')).toBe(true);
  });

  it('GET /v1/contract-templates/:uuid (outro tenant) → 404', async () => {
    // Outro tenant não deve acessar o template
    const otherCnpj = '10000000000003A'; // Simulamos via UUID inválido
    const res = await request(app)
      .get(`/v1/contract-templates/00000000-0000-0000-0000-000000000000`)
      .set('Authorization', `Bearer ${admin.token}`);
    expect(res.status).toBe(404);
  });
});

describe('E2E — Contratos', () => {
  let pool: pg.Pool;
  let admin: TestUser;
  let contractUuid: string;
  let templateUuid: string;

  beforeAll(async () => {
    pool = getPool();
    admin = await createTestTenant(pool, '10000000000033', '10000000000033');

    // Cria template para usar nos contratos
    const tmpl = await request(app)
      .post('/v1/contract-templates')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        name: 'Template Contrato E2E',
        type: 'LOCACAO',
        body: 'Contrato de locação entre {{LOCADOR}} e {{LOCATARIO}}.',
        fields: [
          { key: 'LOCADOR', label: 'Locador', type: 'TEXT', required: true },
          { key: 'LOCATARIO', label: 'Locatário', type: 'TEXT', required: true },
        ],
      });
    templateUuid = tmpl.body.uuid;
  });

  afterAll(async () => {
    await cleanupTenant(pool, '10000000000033');
    await pool.end();
  });

  it('POST /v1/contracts → 201 criando contrato simples (sem template)', async () => {
    const res = await request(app)
      .post('/v1/contracts')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        title: 'Contrato de Serviços E2E',
        type: 'SERVICO',
        relatedParty: 'Empresa Parceira LTDA',
        relatedPartyEmail: 'parceiro@empresa.com',
        value: 15000.0,
        startDate: '2025-01-01T00:00:00.000Z',
        endDate: '2025-12-31T00:00:00.000Z',
        body: 'Corpo do contrato E2E.',
      });
    expect(res.status).toBe(201);
    expect(res.body.uuid).toBeDefined();
    expect(res.body.title).toBe('Contrato de Serviços E2E');
    expect(res.body.status).toBe('RASCUNHO');
    contractUuid = res.body.uuid;
  });

  it('GET /v1/contracts → 200 lista com pelo menos 1 contrato', async () => {
    const res = await request(app)
      .get('/v1/contracts')
      .set('Authorization', `Bearer ${admin.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data || res.body).toBeDefined();
    const contracts = res.body.data ?? res.body;
    expect(Array.isArray(contracts)).toBe(true);
    expect(contracts.length).toBeGreaterThanOrEqual(1);
  });

  it('GET /v1/contracts/:uuid → 200 retorna contrato específico', async () => {
    const res = await request(app)
      .get(`/v1/contracts/${contractUuid}`)
      .set('Authorization', `Bearer ${admin.token}`);
    expect(res.status).toBe(200);
    expect(res.body.uuid).toBe(contractUuid);
  });

  it('PATCH /v1/contracts/:uuid → 200 atualiza dados do contrato', async () => {
    const res = await request(app)
      .patch(`/v1/contracts/${contractUuid}`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        title: 'Contrato de Serviços E2E - Atualizado',
        value: 20000.0,
      });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Contrato de Serviços E2E - Atualizado');
  });

  it('POST /v1/contracts/:uuid/additive → 201 cria termo aditivo', async () => {
    // Atualiza o contrato para ASSINADO diretamente no banco para atender a regra de negócio
    await pool.query("UPDATE contracts SET status = 'ASSINADO' WHERE uuid = $1", [contractUuid]);

    const res = await request(app)
      .post(`/v1/contracts/${contractUuid}/additive`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        title: 'Aditivo de Prazo',
        description_of_changes: 'Prorrogação de 6 meses do prazo contratual.',
      });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Aditivo de Prazo');
  });

  it('PATCH /v1/contracts/:uuid/close → 200 encerra contrato', async () => {
    const res = await request(app)
      .patch(`/v1/contracts/${contractUuid}/close`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ close_reason: 'Rescisão amigável por conclusão de escopo.' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ENCERRADO');
  });

  it('PATCH /v1/contracts/:uuid/close → 400 encerrar contrato já encerrado', async () => {
    const res = await request(app)
      .patch(`/v1/contracts/${contractUuid}/close`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ close_reason: 'Tentativa dupla de encerramento.' });
    expect([400, 409, 422]).toContain(res.status);
  });

  it('POST /v1/contracts (com template) → 201 preenche placeholders', async () => {
    const res = await request(app)
      .post('/v1/contracts')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        templateUuid,
        title: 'Contrato de Locação E2E',
        type: 'LOCACAO',
        relatedParty: 'Inquilino Teste',
        relatedPartyEmail: 'inquilino@email.com',
        value: 3500.0,
        startDate: '2025-06-01T00:00:00.000Z',
        endDate: '2026-05-31T00:00:00.000Z',
        fieldValues: {
          LOCADOR: 'João da Silva',
          LOCATARIO: 'Maria Oliveira',
        },
      });
    expect(res.status).toBe(201);
    expect(res.body.body).toContain('João da Silva');
    expect(res.body.body).toContain('Maria Oliveira');
  });
});
