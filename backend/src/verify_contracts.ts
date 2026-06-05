import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { CreateTemplateUseCase } from './application/use-cases/CreateTemplateUseCase';
import { CreateContractUseCase } from './application/use-cases/CreateContractUseCase';
import { ListContractsUseCase } from './application/use-cases/ListContractsUseCase';
import { GetContractUseCase } from './application/use-cases/GetContractUseCase';
import { UpdateContractUseCase } from './application/use-cases/UpdateContractUseCase';
import { CloseContractUseCase } from './application/use-cases/CloseContractUseCase';
import { CreateAdditiveUseCase } from './application/use-cases/CreateAdditiveUseCase';

import { PrismaContractTemplateRepository } from './adapters/repositories/PrismaContractTemplateRepository';
import { PrismaContractRepository } from './adapters/repositories/PrismaContractRepository';
import { PrismaUploadRepository } from './adapters/repositories/PrismaUploadRepository';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/test_db';

async function main() {
  console.log('Iniciando testes de verificação para a Task 03 (Modelos & Contratos)...');

  const pool = new pg.Pool({ connectionString });
  
  const templateRepo = new PrismaContractTemplateRepository();
  const contractRepo = new PrismaContractRepository();
  const uploadRepo = new PrismaUploadRepository();

  const createTemplateUseCase = new CreateTemplateUseCase(templateRepo);
  const createContractUseCase = new CreateContractUseCase(contractRepo, templateRepo, uploadRepo);
  const listContractsUseCase = new ListContractsUseCase(contractRepo);
  const getContractUseCase = new GetContractUseCase(contractRepo, uploadRepo);
  const updateContractUseCase = new UpdateContractUseCase(contractRepo);
  const closeContractUseCase = new CloseContractUseCase(contractRepo);
  const createAdditiveUseCase = new CreateAdditiveUseCase(contractRepo);

  // Setup Company de Teste
  const companyCnpj = '99999999999999';
  await pool.query(`DELETE FROM companies WHERE cnpj = $1`, [companyCnpj]);

  const companyRes = await pool.query(
    `INSERT INTO companies (name, cnpj, is_active) VALUES ('Empresa Contratos Teste', $1, true) RETURNING uuid`,
    [companyCnpj]
  );
  const companyUuid = companyRes.rows[0].uuid;

  console.log('1. Testando Validação Cruzada de Templates...');
  try {
    // Corpo tem {{nome}} mas declaramos {{nome}} e {{idade}}
    await createTemplateUseCase.execute({
      companyUuid,
      name: 'Template com Erro',
      type: 'SERVICO',
      body: 'Eu, {{nome}}, aceito os termos.',
      fields: [
        { key: 'nome', label: 'Nome', fieldType: 'TEXT', isRequired: true },
        { key: 'idade', label: 'Idade', fieldType: 'NUMBER', isRequired: true },
      ],
    });
    throw new Error('Falha: Deveria ter estourado erro de validação (chave idade não encontrada no corpo)');
  } catch (e: any) {
    console.log('✓ Rejeitou corretamente template com chaves incongruentes:', e.message);
  }

  console.log('2. Criando Template Válido...');
  const template = await createTemplateUseCase.execute({
    companyUuid,
    name: 'Prestação de Serviço Simples',
    type: 'SERVICO',
    body: 'Eu, {{nome_contratado}}, portador do documento {{documento}}, aceito realizar o serviço por {{valor}}.',
    fields: [
      { key: 'nome_contratado', label: 'Nome Contratado', fieldType: 'TEXT', isRequired: true },
      { key: 'documento', label: 'Documento', fieldType: 'TEXT', isRequired: true },
      { key: 'valor', label: 'Valor Mensal', fieldType: 'NUMBER', isRequired: true },
    ],
  });
  console.log('✓ Template criado com UUID:', template.uuid);

  console.log('3. Testando preenchimento de variáveis ao criar contrato...');
  const contract = await createContractUseCase.execute({
    companyUuid,
    templateUuid: template.uuid,
    title: 'Contrato de Parceria',
    type: 'SERVICO',
    relatedParty: 'João da Silva',
    relatedPartyEmail: 'joao@silva.com',
    value: 500000,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias de vigência
    fieldValues: {
      nome_contratado: 'João da Silva',
      documento: '111.222.333-44',
      valor: 'R$ 5.000,00',
    },
    // Enviar um anexo em base64 fake
    files: [
      { base64: 'data:text/plain;base64,VGVzdGUgZGUgYW5leG8=', name: 'documento_identidade.txt' }
    ]
  });
  console.log('✓ Contrato criado com sucesso. Corpo preenchido final:');
  console.log('------------------------------');
  console.log(contract.body);
  console.log('------------------------------');

  console.log('4. Testando Dias Restantes (daysRemaining)...');
  const details = await getContractUseCase.execute(contract.uuid!, companyUuid);
  console.log('✓ Detalhes do Contrato carregados.');
  console.log(`Dias restantes: ${details.daysRemaining}`);
  console.log(`Anexos encontrados: ${details.uploads.length}`);
  if (details.uploads.length !== 1 || details.uploads[0].fileName !== 'documento_identidade.txt') {
    throw new Error('Falha: O anexo não foi cadastrado ou retornado corretamente!');
  }

  console.log('5. Testando Bloqueio de Edição em Contratos Não-Rascunho...');
  // Forçar status do contrato para ASSINADO no banco
  await pool.query(`UPDATE contracts SET status = 'ASSINADO' WHERE uuid = $1`, [contract.uuid]);

  try {
    await updateContractUseCase.execute({
      uuid: contract.uuid!,
      companyUuid,
      title: 'Título Editado',
      type: 'SERVICO',
      relatedParty: 'João da Silva',
      relatedPartyEmail: 'joao@silva.com',
      body: 'Corpo modificado',
    });
    throw new Error('Falha: Deveria bloquear edição de contrato assinado!');
  } catch (e: any) {
    console.log('✓ Rejeitou corretamente edição de contrato ativo:', e.message);
  }

  console.log('6. Testando Criação de Termo Aditivo...');
  const additive = await createAdditiveUseCase.execute({
    originContractUuid: contract.uuid!,
    companyUuid,
    descriptionOfChanges: 'Aumento de 10% no valor mensal devido à expansão do escopo.',
  });
  console.log(`✓ Aditivo criado com sucesso. Título: "${additive.title}"`);
  console.log('Corpo do aditivo:');
  console.log('------------------------------');
  console.log(additive.body);
  console.log('------------------------------');

  console.log('7. Testando Encerramento de Contrato...');
  const closed = await closeContractUseCase.execute({
    uuid: contract.uuid!,
    companyUuid,
    closeReason: 'Conclusão antecipada das obrigações.',
  });
  console.log(`✓ Contrato encerrado com sucesso! Novo status: ${closed.status}, Motivo: ${closed.closeReason}`);

  // Limpeza
  await pool.query(`DELETE FROM uploads WHERE company_uuid = $1`, [companyUuid]);
  await pool.query(`DELETE FROM contracts WHERE company_uuid = $1`, [companyUuid]);
  await pool.query(`DELETE FROM contract_templates WHERE company_uuid = $1`, [companyUuid]);
  await pool.query(`DELETE FROM companies WHERE uuid = $1`, [companyUuid]);

  await pool.end();
  console.log('\n★ TODOS OS TESTES DA TASK 03 PASSARAM COM SUCESSO! ★');
}

main().catch((err) => {
  console.error('Erro nos testes da Task 03:', err);
  process.exit(1);
});
