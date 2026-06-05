import pg from 'pg';
import { CreateObraUseCase } from './application/use-cases/CreateObraUseCase';
import { ListObrasUseCase } from './application/use-cases/ListObrasUseCase';
import { GetObraUseCase } from './application/use-cases/GetObraUseCase';
import { UpdateStepUseCase } from './application/use-cases/UpdateStepUseCase';
import { CreateVistoriaUseCase } from './application/use-cases/CreateVistoriaUseCase';
import { CreateCustoUseCase } from './application/use-cases/CreateCustoUseCase';
import { DeleteCustoUseCase } from './application/use-cases/DeleteCustoUseCase';

import { PrismaObraRepository } from './adapters/repositories/PrismaObraRepository';
import { PrismaObraStepRepository } from './adapters/repositories/PrismaObraStepRepository';
import { PrismaObraCustoRepository } from './adapters/repositories/PrismaObraCustoRepository';
import { PrismaContractRepository } from './adapters/repositories/PrismaContractRepository';
import { PrismaUploadRepository } from './adapters/repositories/PrismaUploadRepository';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/test_db';

async function main() {
  console.log('Iniciando testes de verificação para a Task 05 (Gestão de Obras & Custos)...');

  const pool = new pg.Pool({ connectionString });

  const obraRepo = new PrismaObraRepository();
  const stepRepo = new PrismaObraStepRepository();
  const custoRepo = new PrismaObraCustoRepository();
  const contractRepo = new PrismaContractRepository();
  const uploadRepo = new PrismaUploadRepository();

  const createObraUseCase = new CreateObraUseCase(obraRepo, stepRepo, contractRepo);
  const listObrasUseCase = new ListObrasUseCase(obraRepo);
  const getObraUseCase = new GetObraUseCase(obraRepo, stepRepo, custoRepo, uploadRepo);
  const updateStepUseCase = new UpdateStepUseCase(obraRepo, stepRepo);
  const createVistoriaUseCase = new CreateVistoriaUseCase(obraRepo, uploadRepo);
  const createCustoUseCase = new CreateCustoUseCase(obraRepo, custoRepo, uploadRepo);
  const deleteCustoUseCase = new DeleteCustoUseCase(obraRepo, custoRepo);

  // Setup Company de Teste
  const companyCnpj = '77777777777777';
  await pool.query(`DELETE FROM companies WHERE cnpj = $1`, [companyCnpj]);

  const companyRes = await pool.query(
    `INSERT INTO companies (name, cnpj, is_active) VALUES ('Empresa Obras Teste', $1, true) RETURNING uuid`,
    [companyCnpj]
  );
  const companyUuid = companyRes.rows[0].uuid;

  console.log('1. Criando obra com roteiro padrão...');
  const obra = await createObraUseCase.execute({
    companyUuid,
    name: 'Reforma do Escritório Central',
    address: 'Rua das Flores, 123 - Centro',
    budgetTotal: 5000000, // R$50.000,00 em centavos
  });
  console.log(`✓ Obra criada com UUID: ${obra.uuid}`);

  // Verificar se os 7 steps foram criados automaticamente
  const stepsCount = await pool.query(
    `SELECT COUNT(*) FROM obra_steps WHERE obra_uuid = $1`, [obra.uuid]
  );
  const count = parseInt(stepsCount.rows[0].count);
  console.log(`✓ Roteiro padrão gerado automaticamente com ${count} etapas.`);
  if (count !== 7) throw new Error(`Falha: Esperados 7 steps, encontrado ${count}!`);

  console.log('2. Lançando custos e verificando cost_total...');
  const custo1 = await createCustoUseCase.execute({
    obraUuid: obra.uuid!,
    companyUuid,
    description: 'Tinta para paredes',
    category: 'MATERIAL',
    value: 80000, // R$ 800,00
    date: new Date(),
    receipt: { base64: 'data:text/plain;base64,bm90YQ==', name: 'nota_tinta.txt' },
  });
  console.log(`✓ Custo 1 criado: ${custo1.description} — R$ ${Number(custo1.value) / 100}`);
  console.log(`  Comprovante salvo: ${custo1.receipt?.fileUrl}`);

  await createCustoUseCase.execute({
    obraUuid: obra.uuid!,
    companyUuid,
    description: 'Mão de obra pintor',
    category: 'MAO_DE_OBRA',
    value: 150000, // R$ 1.500,00
    date: new Date(),
  });

  // Verificar cost_total via lista
  const listaObras = await listObrasUseCase.execute({ companyUuid });
  const obraListed = listaObras.find((o) => o.uuid === obra.uuid);
  console.log(`✓ cost_total calculado dinamicamente: R$ ${(obraListed as any).costTotal / 100} (esperado: R$ 2.300,00)`);
  if ((obraListed as any).costTotal !== 230000) {
    throw new Error(`Falha: cost_total incorreto! Esperado 230000, obtido ${(obraListed as any).costTotal}`);
  }

  console.log('3. Completando etapa e verificando completed_at...');
  const stepsRes = await pool.query(
    `SELECT uuid FROM obra_steps WHERE obra_uuid = $1 AND phase = 'PLANEJAMENTO' ORDER BY sort_order ASC LIMIT 1`,
    [obra.uuid]
  );
  const stepUuid = stepsRes.rows[0].uuid;

  const completedStep = await updateStepUseCase.execute({
    stepUuid,
    obraUuid: obra.uuid!,
    companyUuid,
    status: 'CONCLUIDA',
  });
  console.log(`✓ Etapa "${completedStep.name}" marcada como CONCLUIDA.`);
  if (!completedStep.completedAt) {
    throw new Error('Falha: completed_at não foi preenchido!');
  }
  console.log(`✓ completed_at registrado em: ${completedStep.completedAt}`);

  console.log('4. Registrando vistoria com foto...');
  const vistoria = await createVistoriaUseCase.execute({
    obraUuid: obra.uuid!,
    companyUuid,
    type: 'INICIAL',
    description: 'Vistoria inicial antes das obras.',
    photos: [
      { base64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', name: 'foto_inicial.png' }
    ],
  });
  console.log(`✓ Vistoria registrada com ${vistoria.photos?.length} foto(s).`);

  console.log('5. Detalhando obra completa...');
  const detail = await getObraUseCase.execute(obra.uuid!, companyUuid);
  console.log(`✓ Obra detalhada com: ${detail.steps.length} etapas, ${detail.custos.length} custos, ${detail.vistorias.length} vistorias.`);

  console.log('6. Removendo um custo...');
  await deleteCustoUseCase.execute({
    costUuid: custo1.uuid!,
    obraUuid: obra.uuid!,
    companyUuid,
  });
  const afterDelete = await listObrasUseCase.execute({ companyUuid });
  const obraAfterDel = afterDelete.find((o) => o.uuid === obra.uuid);
  console.log(`✓ cost_total após remoção: R$ ${(obraAfterDel as any).costTotal / 100} (esperado: R$ 1.500,00)`);
  if ((obraAfterDel as any).costTotal !== 150000) {
    throw new Error(`Falha: cost_total após delete incorreto! Esperado 150000, obtido ${(obraAfterDel as any).costTotal}`);
  }

  // Limpeza
  await pool.query(`DELETE FROM uploads WHERE company_uuid = $1`, [companyUuid]);
  await pool.query(`DELETE FROM obra_vistorias WHERE obra_uuid = $1`, [obra.uuid]);
  await pool.query(`DELETE FROM obra_custos WHERE obra_uuid = $1`, [obra.uuid]);
  await pool.query(`DELETE FROM obra_steps WHERE obra_uuid = $1`, [obra.uuid]);
  await pool.query(`DELETE FROM obras WHERE company_uuid = $1`, [companyUuid]);
  await pool.query(`DELETE FROM companies WHERE uuid = $1`, [companyUuid]);

  await pool.end();
  console.log('\n★ TODOS OS TESTES DA TASK 05 PASSARAM COM SUCESSO! ★');
}

main().catch((err) => {
  console.error('Erro nos testes da Task 05:', err);
  process.exit(1);
});
