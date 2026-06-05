import { CompanyRepository } from '../../core/ports/repositories/CompanyRepository';
import { UserRepository } from '../../core/ports/repositories/UserRepository';
import { HashService } from '../../core/ports/services/HashService';
import { Company } from '../../core/domain/Company';
import { User } from '../../core/domain/User';

interface RegisterCompanyInput {
  companyName: string;
  cnpj: string;
  userName: string;
  email: string;
  password: string;
}

export class RegisterCompanyUseCase {
  constructor(
    private companyRepository: CompanyRepository,
    private userRepository: UserRepository,
    private hashService: HashService,
  ) {}

  async execute(input: RegisterCompanyInput): Promise<void> {
    // Validar tamanho da senha
    if (!input.password || input.password.length < 8) {
      throw { status: 400, message: 'A senha deve ter no mínimo 8 caracteres' };
    }

    // Validar e-mail
    if (!input.email || !input.email.includes('@')) {
      throw { status: 400, message: 'Formato de e-mail inválido' };
    }

    // Validar CNPJ
    if (!input.cnpj || input.cnpj.length !== 14) {
      throw { status: 400, message: 'O CNPJ deve ter exatamente 14 dígitos' };
    }

    // Verificar se o CNPJ já existe
    const existingCompany = await this.companyRepository.findByCnpj(input.cnpj);
    if (existingCompany) {
      throw { status: 409, message: 'CNPJ já cadastrado' };
    }

    // Verificar se o e-mail já existe
    const existingUser = await this.userRepository.findByEmail(input.email);
    if (existingUser) {
      throw { status: 409, message: 'E-mail já cadastrado' };
    }

    // Criar a empresa
    const company = new Company({
      name: input.companyName,
      cnpj: input.cnpj,
    });

    const createdCompany = await this.companyRepository.create(company);

    // Criar o usuário administrador
    const passwordHash = await this.hashService.hash(input.password);

    const adminUser = new User({
      companyUuid: createdCompany.uuid!,
      name: input.userName,
      email: input.email,
      passwordHash,
      role: 'ADMIN',
      status: 'ATIVO',
    });

    await this.userRepository.create(adminUser);
  }
}
