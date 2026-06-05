import { PrismaClient, UserRole, UserStatus, ContractType, TemplateFieldType } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Iniciando o seeding do banco de dados...');

  // 1. Limpar dados antigos para permitir rodar o seed múltiplas vezes de forma limpa
  // (Devido às chaves estrangeiras CASCADE, apagar a empresa apaga os outros dados vinculados)
  await prisma.company.deleteMany({
    where: {
      cnpj: '12345678000190'
    }
  });

  // 2. Criar a empresa de teste (Tenant)
  const company = await prisma.company.create({
    data: {
      name: 'Construtora Exemplo LTDA',
      cnpj: '12345678000190',
      email: 'contato@exemplo.com.br',
      phone: '11999998888',
      address: 'Avenida Paulista, 1000 - São Paulo/SP',
      isActive: true,
    },
  });
  console.log(`Empresa criada: ${company.name} (UUID: ${company.uuid})`);

  // 3. Criar os usuários com senhas hasheadas
  const passwordHash = await bcrypt.hash('senha1234', 10);

  const admin = await prisma.user.create({
    data: {
      companyUuid: company.uuid,
      name: 'Carlos Souza (Admin)',
      email: 'admin@exemplo.com',
      passwordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ATIVO,
    },
  });

  const editor = await prisma.user.create({
    data: {
      companyUuid: company.uuid,
      name: 'Joana Silva (Editor)',
      email: 'editor@exemplo.com',
      passwordHash,
      role: UserRole.EDITOR,
      status: UserStatus.ATIVO,
    },
  });

  const viewer = await prisma.user.create({
    data: {
      companyUuid: company.uuid,
      name: 'Lucas Santos (Viewer)',
      email: 'viewer@exemplo.com',
      passwordHash,
      role: UserRole.VIEWER,
      status: UserStatus.ATIVO,
    },
  });

  console.log('Usuários criados: admin@exemplo.com, editor@exemplo.com, viewer@exemplo.com');

  // 4. Criar Templates de Contrato Iniciais
  
  // Template 1: Prestação de Serviço Padrão
  const serviceTemplate = await prisma.contractTemplate.create({
    data: {
      companyUuid: company.uuid,
      name: 'Prestação de Serviço Padrão',
      type: ContractType.SERVICO,
      description: 'Template base para contratação de prestadores de serviços em geral.',
      body: 'CONTRATO DE PRESTAÇÃO DE SERVIÇOS\n\nContratada: {{nome_prestador}}, CPF/CNPJ nº {{cpf_cnpj_prestador}}.\n\nServiços: {{descricao_servicos}}.\n\nValor: R$ {{valor_total}} com início em {{data_inicio}}.',
      isActive: true,
      fields: {
        create: [
          { key: 'nome_prestador', label: 'Nome do Prestador', fieldType: TemplateFieldType.TEXT, isRequired: true, sortOrder: 1 },
          { key: 'cpf_cnpj_prestador', label: 'CPF/CNPJ do Prestador', fieldType: TemplateFieldType.TEXT, isRequired: true, sortOrder: 2 },
          { key: 'descricao_servicos', label: 'Descrição dos Serviços', fieldType: TemplateFieldType.TEXT, isRequired: true, sortOrder: 3 },
          { key: 'valor_total', label: 'Valor Total', fieldType: TemplateFieldType.NUMBER, isRequired: true, sortOrder: 4 },
          { key: 'data_inicio', label: 'Data de Início', fieldType: TemplateFieldType.DATE, isRequired: true, sortOrder: 5 },
        ],
      },
    },
  });
  console.log(`Template criado: ${serviceTemplate.name}`);

  // Template 2: Contrato de Obra
  const obraTemplate = await prisma.contractTemplate.create({
    data: {
      companyUuid: company.uuid,
      name: 'Contrato de Obra',
      type: ContractType.OBRA,
      description: 'Template para execução e gerenciamento de obras de engenharia.',
      body: 'CONTRATO DE EMPREITADA DE OBRA\n\nLocal da Obra: {{endereco_obra}}.\n\nValor pactuado: R$ {{valor_obra}}, a ser executado em {{prazo_dias}} dias corridos.\n\nAssinatura do Responsável: {{assinatura_responsavel}}.',
      isActive: true,
      fields: {
        create: [
          { key: 'endereco_obra', label: 'Endereço da Obra', fieldType: TemplateFieldType.ADDRESS, isRequired: true, sortOrder: 1 },
          { key: 'valor_obra', label: 'Valor da Obra', fieldType: TemplateFieldType.NUMBER, isRequired: true, sortOrder: 2 },
          { key: 'prazo_dias', label: 'Prazo em Dias', fieldType: TemplateFieldType.NUMBER, isRequired: true, sortOrder: 3 },
          { key: 'assinatura_responsavel', label: 'Assinatura do Responsável', fieldType: TemplateFieldType.SIGNATURE, isRequired: true, sortOrder: 4 },
        ],
      },
    },
  });
  console.log(`Template criado: ${obraTemplate.name}`);

  // Template 3: Contrato de Locação
  const locacaoTemplate = await prisma.contractTemplate.create({
    data: {
      companyUuid: company.uuid,
      name: 'Contrato de Locação',
      type: ContractType.LOCACAO,
      description: 'Template para locação comercial ou residencial.',
      body: 'CONTRATO DE LOCAÇÃO DE IMÓVEL\n\nImóvel: {{endereco_imovel}}.\n\nLocatário: {{nome_locatario}}.\n\nValor do Aluguel: R$ {{valor_mensal}} mensais com vencimento no dia {{dia_vencimento}} de cada mês.',
      isActive: true,
      fields: {
        create: [
          { key: 'endereco_imovel', label: 'Endereço do Imóvel', fieldType: TemplateFieldType.ADDRESS, isRequired: true, sortOrder: 1 },
          { key: 'nome_locatario', label: 'Nome do Locatário', fieldType: TemplateFieldType.TEXT, isRequired: true, sortOrder: 2 },
          { key: 'valor_mensal', label: 'Valor Mensal', fieldType: TemplateFieldType.NUMBER, isRequired: true, sortOrder: 3 },
          { key: 'dia_vencimento', label: 'Dia de Vencimento', fieldType: TemplateFieldType.NUMBER, isRequired: true, sortOrder: 4 },
        ],
      },
    },
  });
  console.log(`Template criado: ${locacaoTemplate.name}`);

  console.log('Seeding concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('Erro durante o seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
