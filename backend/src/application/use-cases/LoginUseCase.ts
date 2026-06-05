import { UserRepository } from '../../core/ports/repositories/UserRepository';
import { CompanyRepository } from '../../core/ports/repositories/CompanyRepository';
import { HashService } from '../../core/ports/services/HashService';
import { TokenService } from '../../core/ports/services/TokenService';

interface LoginInput {
  email: string;
  password: string;
}

interface LoginOutput {
  token: string;
  user: {
    uuid: string;
    name: string;
    email: string;
    role: string;
  };
  company: {
    uuid: string;
    name: string;
  };
}

export class LoginUseCase {
  constructor(
    private userRepository: UserRepository,
    private companyRepository: CompanyRepository,
    private hashService: HashService,
    private tokenService: TokenService,
  ) {}

  async execute(input: LoginInput): Promise<LoginOutput> {
    const emailNormalized = input.email.toLowerCase().trim();

    const user = await this.userRepository.findByEmail(emailNormalized);
    if (!user) {
      throw { status: 401, message: 'Credenciais inválidas' };
    }

    if (user.status !== 'ATIVO') {
      throw { status: 403, message: 'Usuário inativo' };
    }

    const isPasswordValid = await this.hashService.compare(input.password, user.passwordHash);
    if (!isPasswordValid) {
      throw { status: 401, message: 'Credenciais inválidas' };
    }

    const company = await this.companyRepository.findById(user.companyUuid);
    if (!company) {
      throw { status: 404, message: 'Empresa não encontrada' };
    }

    if (!company.isActive) {
      throw { status: 403, message: 'Empresa inativa' };
    }

    const payload = {
      user: {
        uuid: user.uuid!,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      company: {
        uuid: company.uuid!,
        name: company.name,
      },
    };

    const token = this.tokenService.generate(payload);

    return {
      token,
      user: payload.user,
      company: payload.company,
    };
  }
}
