import { UserRepository } from '../../core/ports/repositories/UserRepository';
import { HashService } from '../../core/ports/services/HashService';
import { User, UserRole, UserStatus } from '../../core/domain/User';

interface CreateUserInput {
  companyUuid: string;
  name: string;
  email: string;
  password?: string; // se não enviado, podemos usar um padrão ou exigir
  role: UserRole;
  status: UserStatus;
}

export class CreateUserUseCase {
  constructor(
    private userRepository: UserRepository,
    private hashService: HashService,
  ) {}

  async execute(input: CreateUserInput): Promise<User> {
    const emailNormalized = input.email.toLowerCase().trim();

    if (!input.name || input.name.trim().length === 0) {
      throw { status: 400, message: 'Nome é obrigatório' };
    }

    if (!input.email || !input.email.includes('@')) {
      throw { status: 400, message: 'E-mail inválido' };
    }

    const existingUser = await this.userRepository.findByEmail(emailNormalized);
    if (existingUser) {
      throw { status: 409, message: 'E-mail já cadastrado' };
    }

    const passwordRaw = input.password || 'Mudar@123';
    if (passwordRaw.length < 8) {
      throw { status: 400, message: 'A senha deve ter no mínimo 8 caracteres' };
    }

    const passwordHash = await this.hashService.hash(passwordRaw);

    const user = new User({
      companyUuid: input.companyUuid,
      name: input.name,
      email: emailNormalized,
      passwordHash,
      role: input.role,
      status: input.status,
    });

    return this.userRepository.create(user);
  }
}
