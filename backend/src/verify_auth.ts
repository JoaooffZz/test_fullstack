import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { RegisterCompanyUseCase } from './application/use-cases/RegisterCompanyUseCase';
import { LoginUseCase } from './application/use-cases/LoginUseCase';
import { CreateUserUseCase } from './application/use-cases/CreateUserUseCase';
import { ListUsersUseCase } from './application/use-cases/ListUsersUseCase';
import { PrismaCompanyRepository } from './adapters/repositories/PrismaCompanyRepository';
import { PrismaUserRepository } from './adapters/repositories/PrismaUserRepository';
import { BcryptHashService } from './infrastructure/providers/BcryptHashService';
import { JwtTokenService } from './infrastructure/providers/JwtTokenService';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/test_db';

async function main() {
  console.log('Iniciando testes de verificação do Fluxo de Autenticação e Multi-tenancy...');

  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  
  const companyRepo = new PrismaCompanyRepository();
  const userRepo = new PrismaUserRepository();
  const hashService = new BcryptHashService();
  const tokenService = new JwtTokenService();

  const registerUseCase = new RegisterCompanyUseCase(companyRepo, userRepo, hashService);
  const loginUseCase = new LoginUseCase(userRepo, companyRepo, hashService, tokenService);
  const createUserUseCase = new CreateUserUseCase(userRepo, hashService);
  const listUsersUseCase = new ListUsersUseCase(userRepo);

  const testCnpj = '12345678901234';
  const testEmail = 'admin@empresa1.com';
  
  // Limpar dados de teste anteriores
  await pool.query(`DELETE FROM users WHERE email = $1`, [testEmail]);
  await pool.query(`DELETE FROM companies WHERE cnpj = $1`, [testCnpj]);

  console.log('1. Testando Registro de Empresa e Administrador...');
  await registerUseCase.execute({
    companyName: 'Empresa Teste LTDA',
    cnpj: testCnpj,
    userName: 'Admin Teste',
    email: testEmail,
    password: 'senha_segura_123',
  });
  console.log('✓ Registro concluído com sucesso!');

  console.log('2. Testando Login com Credenciais Corretas...');
  const loginResult = await loginUseCase.execute({
    email: testEmail,
    password: 'senha_segura_123',
  });
  console.log('✓ Login bem-sucedido!');
  console.log('Payload do token gerado:', tokenService.verify(loginResult.token));

  console.log('3. Testando Login com Credenciais Incorretas (Deve falhar)...');
  try {
    await loginUseCase.execute({
      email: testEmail,
      password: 'senha_errada',
    });
    throw new Error('Falha: login deveria ter sido rejeitado!');
  } catch (e: any) {
    if (e.status === 401) {
      console.log('✓ Login com senha incorreta corretamente rejeitado com status 401!');
    } else {
      throw e;
    }
  }

  console.log('4. Testando Isolamento Multi-tenant (Listar Usuários)...');
  const userList = await listUsersUseCase.execute(loginResult.company.uuid);
  console.log(`✓ Encontrados ${userList.length} usuários para a empresa.`);
  if (userList.length !== 1 || userList[0].email !== testEmail) {
    throw new Error('Falha: A listagem de usuários retornou dados incorretos!');
  }
  console.log('✓ Isolamento inicial OK!');

  console.log('5. Testando Criação de Novo Usuário na mesma Empresa...');
  const newUser = await createUserUseCase.execute({
    companyUuid: loginResult.company.uuid,
    name: 'Vendedor Teste',
    email: 'vendedor@empresa1.com',
    role: 'EDITOR',
    status: 'ATIVO',
  });
  console.log('✓ Usuário vendedor criado:', newUser.name, newUser.email);

  const updatedUserList = await listUsersUseCase.execute(loginResult.company.uuid);
  console.log(`✓ Lista de usuários atualizada com sucesso. Total: ${updatedUserList.length}`);
  if (updatedUserList.length !== 2) {
    throw new Error('Falha: O novo usuário não consta na lista da empresa!');
  }

  // Limpeza
  await pool.query(`DELETE FROM users WHERE company_uuid = $1`, [loginResult.company.uuid]);
  await pool.query(`DELETE FROM companies WHERE uuid = $1`, [loginResult.company.uuid]);

  await pool.end();
  console.log('\n★ TODOS OS TESTES PASSARAM COM SUCESSO! ★');
}

main().catch((err) => {
  console.error('Erro nos testes de verificação:', err);
  process.exit(1);
});
