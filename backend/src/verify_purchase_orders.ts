import pg from 'pg';
import { CreatePurchaseOrderUseCase } from './application/use-cases/CreatePurchaseOrderUseCase';
import { ListPurchaseOrdersUseCase } from './application/use-cases/ListPurchaseOrdersUseCase';
import { GetPurchaseOrderUseCase } from './application/use-cases/GetPurchaseOrderUseCase';
import { UpdatePurchaseOrderStatusUseCase } from './application/use-cases/UpdatePurchaseOrderStatusUseCase';

import { PrismaPurchaseOrderRepository } from './adapters/repositories/PrismaPurchaseOrderRepository';
import { PrismaObraRepository } from './adapters/repositories/PrismaObraRepository';
import { PrismaObraCustoRepository } from './adapters/repositories/PrismaObraCustoRepository';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/test_db';

async function main() {
  console.log('Iniciando testes de verificação para a Task 06 (Ordens de Compra)...');

  const pool = new pg.Pool({ connectionString });

  const orderRepo = new PrismaPurchaseOrderRepository();
  const obraRepo = new PrismaObraRepository();
  const custoRepo = new PrismaObraCustoRepository();

  const createUseCase = new CreatePurchaseOrderUseCase(orderRepo, obraRepo);
  const listUseCase = new ListPurchaseOrdersUseCase(orderRepo);
  const getUseCase = new GetPurchaseOrderUseCase(orderRepo);
  const updateStatusUseCase = new UpdatePurchaseOrderStatusUseCase(orderRepo, custoRepo);

  // Setup Company de Teste
  const companyCnpj = '88888888888888';
  await pool.query(`DELETE FROM companies WHERE cnpj = $1`, [companyCnpj]);

  const companyRes = await pool.query(
    `INSERT INTO companies (name, cnpj, is_active) VALUES ('Empresa OC Teste', $1, true) RETURNING uuid`,
    [companyCnpj]
  );
  const companyUuid = companyRes.rows[0].uuid;

  // Cria Obra
  const obraRes = await pool.query(
    `INSERT INTO obras (company_uuid, name, address) VALUES ($1, 'Obra da O.C.', 'Rua X') RETURNING uuid`,
    [companyUuid]
  );
  const obraUuid = obraRes.rows[0].uuid;

  console.log('1. Criando Ordem de Compra em RASCUNHO...');
  const order = await createUseCase.execute({
    companyUuid,
    obraUuid,
    supplierName: 'Distribuidora Cimento Forte',
    payerCnpj: companyCnpj,
    items: [
      { description: 'Saco de Cimento 50kg', quantity: 100, unit: 'SC', unitPrice: 4000 }, // R$ 40,00 * 100 = R$ 4.000,00
      { description: 'Areia Lavada M3', quantity: 10, unit: 'M3', unitPrice: 12000 }, // R$ 120,00 * 10 = R$ 1.200,00
    ],
  });

  console.log(`✓ Ordem de Compra criada: UUID: ${order.uuid}, Número: ${order.number}, Status: ${order.status}`);
  if (!order.number) {
    throw new Error('Falha: Número identificador automático não foi gerado pelo trigger do PostgreSQL!');
  }

  console.log('2. Verificando detalhamento da O.C. (soma total de itens)...');
  const details = await getUseCase.execute(order.uuid!, companyUuid);
  console.log(`✓ Detalhado: ${details.items.length} itens. Valor Total Calculado: R$ ${details.totalValue / 100}`);
  if (details.totalValue !== 520000) {
    throw new Error(`Falha: Valor total incorreto. Esperado 520000, obtido ${details.totalValue}`);
  }

  console.log('3. Emitindo O.C. (RASCUNHO -> EMITIDA)...');
  const emitted = await updateStatusUseCase.execute({
    uuid: order.uuid!,
    companyUuid,
    userRole: 'EDITOR',
    status: 'EMITIDA',
  });
  console.log(`✓ Status atualizado para: ${emitted.status}`);

  console.log('4. Testando restrição de role (VIEWER tentando aprovar)...');
  try {
    await updateStatusUseCase.execute({
      uuid: order.uuid!,
      companyUuid,
      userRole: 'VIEWER',
      status: 'APROVADA',
    });
    throw new Error('Falha: Usuário VIEWER conseguiu aprovar a O.C.!');
  } catch (error: any) {
    if (error.status === 403) {
      console.log('✓ Bloqueio de VIEWER funcionou corretamente (403 Forbidden).');
    } else {
      throw error;
    }
  }

  console.log('5. Aprovando O.C. (EMITIDA -> APROVADA) e validando lançamento automático de custo...');
  const approved = await updateStatusUseCase.execute({
    uuid: order.uuid!,
    companyUuid,
    userRole: 'ADMIN',
    status: 'APROVADA',
  });
  console.log(`✓ Status atualizado para: ${approved.status}`);

  // Verificar se o custo foi lançado no banco de dados automaticamente
  const custosRes = await pool.query(
    `SELECT * FROM obra_custos WHERE obra_uuid = $1`, [obraUuid]
  );
  console.log(`✓ Custos lançados na obra automaticamente: ${custosRes.rows.length} registros.`);
  if (custosRes.rows.length !== 1) {
    throw new Error('Falha: Custo da O.C. aprovada não foi inserido na tabela obra_custos!');
  }
  const custo = custosRes.rows[0];
  console.log(`  Custo criado: ${custo.description} — R$ ${Number(custo.value) / 100}`);
  if (Number(custo.value) !== 520000) {
    throw new Error(`Falha: Valor do custo inserido está incorreto. Esperado 520000, obtido ${custo.value}`);
  }

  // Limpeza
  await pool.query(`DELETE FROM obra_custos WHERE obra_uuid = $1`, [obraUuid]);
  await pool.query(`DELETE FROM purchase_order_items WHERE purchase_order_uuid = $1`, [order.uuid]);
  await pool.query(`DELETE FROM purchase_orders WHERE company_uuid = $1`, [companyUuid]);
  await pool.query(`DELETE FROM obras WHERE company_uuid = $1`, [companyUuid]);
  await pool.query(`DELETE FROM companies WHERE uuid = $1`, [companyUuid]);

  await pool.end();
  console.log('\n★ TODOS OS TESTES DA TASK 06 PASSARAM COM SUCESSO! ★');
}

main().catch((err) => {
  console.error('Erro nos testes da Task 06:', err);
  process.exit(1);
});
