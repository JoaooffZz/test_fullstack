import pg from 'pg';
import { CreateContractUseCase } from './application/use-cases/CreateContractUseCase';
import { CreateSignatureRequestUseCase } from './application/use-cases/CreateSignatureRequestUseCase';
import { ValidateSignatureTokenUseCase } from './application/use-cases/ValidateSignatureTokenUseCase';
import { ExecuteSignatureUseCase } from './application/use-cases/ExecuteSignatureUseCase';

import { PrismaContractRepository } from './adapters/repositories/PrismaContractRepository';
import { PrismaContractTemplateRepository } from './adapters/repositories/PrismaContractTemplateRepository';
import { PrismaUploadRepository } from './adapters/repositories/PrismaUploadRepository';
import { PrismaSignatureRequestRepository } from './adapters/repositories/PrismaSignatureRequestRepository';
import { PrismaAuditRepository } from './adapters/repositories/PrismaAuditRepository';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/test_db';

async function main() {
  console.log('Iniciando testes de verificação para a Task 04 (Assinaturas Eletrônicas)...');

  const pool = new pg.Pool({ connectionString });

  const contractRepo = new PrismaContractRepository();
  const templateRepo = new PrismaContractTemplateRepository();
  const uploadRepo = new PrismaUploadRepository();
  const signatureRepo = new PrismaSignatureRequestRepository();
  const auditRepo = new PrismaAuditRepository();

  const createContractUseCase = new CreateContractUseCase(contractRepo, templateRepo, uploadRepo);
  const createSignatureRequestUseCase = new CreateSignatureRequestUseCase(contractRepo, signatureRepo);
  const validateSignatureTokenUseCase = new ValidateSignatureTokenUseCase(signatureRepo, contractRepo);
  const executeSignatureUseCase = new ExecuteSignatureUseCase(signatureRepo, contractRepo, auditRepo);

  // Setup Company de Teste
  const companyCnpj = '88888888888888';
  await pool.query(`DELETE FROM companies WHERE cnpj = $1`, [companyCnpj]);

  const companyRes = await pool.query(
    `INSERT INTO companies (name, cnpj, is_active) VALUES ('Empresa Sign Teste', $1, true) RETURNING uuid`,
    [companyCnpj]
  );
  const companyUuid = companyRes.rows[0].uuid;

  console.log('1. Criando Contrato de Teste (Rascunho)...');
  const contract = await createContractUseCase.execute({
    companyUuid,
    title: 'Contrato Assinatura Teste',
    type: 'SERVICO',
    relatedParty: 'Maria da Penha',
    relatedPartyEmail: 'maria@penha.com',
    value: 1200000,
    body: 'Eu Maria aceito as obrigações pactuadas.',
  });
  console.log(`✓ Contrato criado com status inicial: ${contract.status}`);

  console.log('2. Criando Solicitação de Assinatura (Mudar para AGUARDANDO_ASSINATURA)...');
  const signatureReqResult = await createSignatureRequestUseCase.execute({
    contractUuid: contract.uuid!,
    companyUuid,
    channel: 'AMBOS',
  });
  console.log('✓ Solicitação gerada com link:', signatureReqResult.link);

  // Checar no banco se o contrato mudou de status
  const contractAfterReq = await contractRepo.findById(contract.uuid!, companyUuid);
  console.log(`✓ Status do contrato atualizado: ${contractAfterReq?.status}`);
  if (contractAfterReq?.status !== 'AGUARDANDO_ASSINATURA') {
    throw new Error('Falha: O contrato deveria ter mudado para AGUARDANDO_ASSINATURA!');
  }

  console.log('3. Validando Token Público...');
  const validationResult = await validateSignatureTokenUseCase.execute(signatureReqResult.token);
  console.log(`✓ Validação do token OK. Contrato a assinar: "${validationResult.contract.title}"`);

  console.log('4. Executando Assinatura Eletrônica Pública (Aceite do assinante)...');
  await executeSignatureUseCase.execute({
    token: signatureReqResult.token,
    name: 'Maria da Penha de Carvalho',
    ipAddress: '192.168.1.55',
  });
  console.log('✓ Execução concluída.');

  console.log('5. Verificando Sincronização do Status do Contrato (Trigger trg_sync_contract_signed)...');
  // Aguardar 100ms para garantir a execução do trigger assíncrono no banco se houver delay
  await new Promise((r) => setTimeout(r, 100));

  const finalContract = await contractRepo.findById(contract.uuid!, companyUuid);
  console.log(`✓ Status final do contrato no banco: ${finalContract?.status}`);
  if (finalContract?.status !== 'ASSINADO') {
    throw new Error('Falha: O trigger do banco não atualizou o contrato para ASSINADO!');
  }

  console.log('6. Verificando Geração do Log de Auditoria...');
  const auditRes = await pool.query(
    `SELECT * FROM audit_logs WHERE company_uuid = $1 AND action = 'SIGN' ORDER BY created_at DESC LIMIT 1`,
    [companyUuid]
  );
  if (auditRes.rows.length !== 1) {
    throw new Error('Falha: O registro de auditoria SIGN não foi gravado no banco!');
  }
  const auditLog = auditRes.rows[0];
  console.log(`✓ Registro de auditoria encontrado: "${auditLog.description}" com IP ${auditLog.ip_address}`);

  // Limpeza
  await pool.query(`DELETE FROM audit_logs WHERE company_uuid = $1`, [companyUuid]);
  await pool.query(`DELETE FROM signature_requests WHERE contract_uuid = $1`, [contract.uuid]);
  await pool.query(`DELETE FROM contracts WHERE company_uuid = $1`, [companyUuid]);
  await pool.query(`DELETE FROM companies WHERE uuid = $1`, [companyUuid]);

  await pool.end();
  console.log('\n★ TODOS OS TESTES DA TASK 04 PASSARAM COM SUCESSO! ★');
}

main().catch((err) => {
  console.error('Erro nos testes da Task 04:', err);
  process.exit(1);
});
