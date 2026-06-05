import pg from 'pg';
import { GetDashboardMetricsUseCase } from './application/use-cases/GetDashboardMetricsUseCase';
import { GetContractsReportUseCase } from './application/use-cases/GetContractsReportUseCase';
import { GetObrasReportUseCase } from './application/use-cases/GetObrasReportUseCase';
import { CsvHelper } from './utils/csvHelper';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/test_db';

async function main() {
  console.log('Iniciando testes de verificação para a Task 07 (Dashboard & Relatórios)...');

  const pool = new pg.Pool({ connectionString });

  const getDashboardUseCase = new GetDashboardMetricsUseCase();
  const getContractsUseCase = new GetContractsReportUseCase();
  const getObrasUseCase = new GetObrasReportUseCase();

  // Setup Company de Teste
  const companyCnpj = '99999999999999';
  await pool.query(`DELETE FROM companies WHERE cnpj = $1`, [companyCnpj]);

  const companyRes = await pool.query(
    `INSERT INTO companies (name, cnpj, is_active) VALUES ('Empresa Analytics Teste', $1, true) RETURNING uuid`,
    [companyCnpj]
  );
  const companyUuid = companyRes.rows[0].uuid;

  console.log('1. Populando dados fictícios para a empresa...');
  
  // Cadastrar Contratos
  await pool.query(
    `INSERT INTO contracts (company_uuid, title, type, status, value, related_party, related_party_email, body) 
     VALUES ($1, 'Contrato de Pintura', 'SERVICO', 'ASSINADO', 1200000, 'Pintor X', 'pintor@teste.com', 'Corpo do contrato'),
            ($1, 'Contrato de Aluguel', 'LOCACAO', 'AGUARDANDO_ASSINATURA', 500000, 'Imobiliária Y', 'imobiliaria@teste.com', 'Corpo do contrato')`,
    [companyUuid]
  );

  // Cadastrar Obras
  const obraRes = await pool.query(
    `INSERT INTO obras (company_uuid, name, address, status, budget_total) 
     VALUES ($1, 'Obra Galpão Sul', 'Avenida Sul, 100', 'EM_EXECUCAO', 3000000) RETURNING uuid`,
    [companyUuid]
  );
  const obraUuid = obraRes.rows[0].uuid;

  // Lançar Custos na Obra
  await pool.query(
    `INSERT INTO obra_custos (obra_uuid, description, category, value, date) 
     VALUES ($1, 'Compra de Tijolo', 'MATERIAL', 450000, NOW()),
            ($1, 'Fundações', 'MAO_DE_OBRA', 1200000, NOW())`,
    [obraUuid]
  );

  // Cadastrar O.C.s
  await pool.query(
    `INSERT INTO purchase_orders (company_uuid, number, supplier_name, payer_cnpj, status) 
     VALUES ($1, 'OC-2026-9999', 'Fornecedor A', '11111111111111', 'EMITIDA')`,
    [companyUuid]
  );

  console.log('2. Buscando métricas do Dashboard...');
  const dashboard = await getDashboardUseCase.execute({ companyUuid });
  
  console.log(`✓ Total de Contratos: ${dashboard.contracts.total}`);
  console.log(`✓ Contratos Ativos: ${dashboard.contracts.ativos}`);
  console.log(`✓ Obras em Execução: ${dashboard.obras.emExecucao}`);
  console.log(`✓ Orçamento Consolidado: R$ ${dashboard.obras.orcamentoConsolidado / 100}`);
  console.log(`✓ Custo Realizado Consolidado: R$ ${dashboard.obras.custoRealizadoConsolidado / 100}`);
  console.log(`✓ Ordens de Compra aguardando aprovação: ${dashboard.purchaseOrders.aguardandoAprovacao}`);

  if (dashboard.contracts.total !== 2 || dashboard.obras.emExecucao !== 1) {
    throw new Error('Falha: Métricas básicas de contratos/obras do dashboard incorretas!');
  }
  if (dashboard.obras.orcamentoConsolidado !== 3000000 || dashboard.obras.custoRealizadoConsolidado !== 1650000) {
    throw new Error('Falha: Consolidação financeira do orçamento/custo incorreta!');
  }

  console.log('3. Validando Relatório de Contratos...');
  const contractsReport = await getContractsUseCase.execute({ companyUuid, status: 'ASSINADO' });
  console.log(`✓ Contratos filtrados por status ASSINADO: ${contractsReport.length}`);
  if (contractsReport.length !== 1) {
    throw new Error('Falha: Filtro de status no relatório de contratos não funcionou!');
  }

  console.log('4. Validando Relatório de Obras...');
  const obrasReport = await getObrasReportData(companyUuid, getObrasUseCase);
  console.log(`✓ Obra: ${obrasReport[0].name}, Saldo: R$ ${obrasReport[0].saldo / 100}`);
  if (obrasReport[0].saldo !== 1350000) {
    throw new Error(`Falha: Saldo orçamentário calculado incorretamente. Obtido: ${obrasReport[0].saldo}`);
  }

  console.log('5. Validando Geração de CSV...');
  const headers = ['Nome da Obra', 'Custo Realizado'];
  const rows = obrasReport.map(o => [o.name, String(o.custoRealizado)]);
  const csv = CsvHelper.toCsv(headers, rows);
  console.log('✓ CSV gerado com sucesso. Verificando presença do UTF-8 BOM...');
  if (!csv.startsWith('\uFEFF')) {
    throw new Error('Falha: UTF-8 BOM não foi detectado no início do CSV!');
  }

  // Limpeza
  await pool.query(`DELETE FROM purchase_orders WHERE company_uuid = $1`, [companyUuid]);
  await pool.query(`DELETE FROM obra_custos WHERE obra_uuid = $1`, [obraUuid]);
  await pool.query(`DELETE FROM obras WHERE company_uuid = $1`, [companyUuid]);
  await pool.query(`DELETE FROM contracts WHERE company_uuid = $1`, [companyUuid]);
  await pool.query(`DELETE FROM companies WHERE uuid = $1`, [companyUuid]);

  await pool.end();
  console.log('\n★ TODOS OS TESTES DA TASK 07 PASSARAM COM SUCESSO! ★');
}

async function getObrasReportData(companyUuid: string, useCase: GetObrasReportUseCase) {
  return useCase.execute({ companyUuid });
}

main().catch((err) => {
  console.error('Erro nos testes da Task 07:', err);
  process.exit(1);
});
