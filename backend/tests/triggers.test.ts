import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../src/infrastructure/database/prisma';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/test_db';

describe('PostgreSQL Database Triggers', () => {
  let pool: pg.Pool;
  let companyUuid: string;

  beforeAll(async () => {
    pool = new pg.Pool({ connectionString });
    
    // Limpeza
    await pool.query(`DELETE FROM companies WHERE cnpj = '98765432101234'`);
    
    const companyRes = await pool.query(
      `INSERT INTO companies (name, cnpj, is_active) VALUES ('Trigger Test Company', '98765432101234', true) RETURNING uuid`
    );
    companyUuid = companyRes.rows[0].uuid;
  });

  afterAll(async () => {
    await pool.query(`DELETE FROM signature_requests WHERE contract_uuid IN (SELECT uuid FROM contracts WHERE company_uuid = $1)`, [companyUuid]);
    await pool.query(`DELETE FROM contracts WHERE company_uuid = $1`, [companyUuid]);
    await pool.query(`DELETE FROM purchase_orders WHERE company_uuid = $1`, [companyUuid]);
    await pool.query(`DELETE FROM companies WHERE cnpj = '98765432101234'`);
    await pool.end();
  });

  it('deve disparar trg_purchase_orders_number para auto-gerar o número sequencial', async () => {
    const po = await prisma.purchaseOrder.create({
      data: {
        companyUuid,
        number: '', // Necessário enviar string vazia para ativar o trigger no Postgres
        supplierName: 'Fornecedor de Alvenaria',
        payerCnpj: '98765432101234',
        status: 'RASCUNHO',
      },
    });

    expect(po.number).toBeDefined();
    expect(po.number).toMatch(/^OC-\d{4}-\d{4}$/); // Deve bater com formato OC-YYYY-NNNN
  });

  it('deve disparar o trigger de sincronização de status de assinatura do contrato', async () => {
    // 1. Criar contrato em AGUARDANDO_ASSINATURA
    const contract = await prisma.contract.create({
      data: {
        companyUuid,
        title: 'Contrato com Trigger de Assinatura',
        type: 'SERVICO',
        status: 'AGUARDANDO_ASSINATURA',
        relatedParty: 'Parceiro X',
        relatedPartyEmail: 'parceiro@x.com',
        body: 'Texto padrão',
        value: 500000,
      },
    });

    // 2. Criar a assinatura em PENDENTE
    const sig = await prisma.signatureRequest.create({
      data: {
        contractUuid: contract.uuid,
        signerName: 'Parceiro X',
        status: 'ENVIADO',
        channel: 'EMAIL',
        token: 'TOKEN-TESTE-123',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    // 3. Atualizar assinatura para ASSINADO e verificar se o trigger disparou e atualizou o contrato
    await prisma.signatureRequest.update({
      where: { uuid: sig.uuid },
      data: { status: 'ASSINADO' },
    });

    const updatedContract = await prisma.contract.findUnique({
      where: { uuid: contract.uuid },
    });

    expect(updatedContract?.status).toBe('ASSINADO');
  });
});
