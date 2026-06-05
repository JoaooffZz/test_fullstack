import { UserRepository } from '../../core/ports/repositories/UserRepository';
import { User, UserRole, UserStatus } from '../../core/domain/User';

interface UpdateUserInput {
  uuid: string;
  companyUuid: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
}

export class UpdateUserUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(input: UpdateUserInput): Promise<User> {
    const emailNormalized = input.email.toLowerCase().trim();

    if (!input.name || input.name.trim().length === 0) {
      throw { status: 400, message: 'Nome é obrigatório' };
    }

    if (!input.email || !input.email.includes('@')) {
      throw { status: 400, message: 'E-mail inválido' };
    }

    const user = await this.userRepository.findById(input.uuid, input.companyUuid);
    if (!user) {
      throw { status: 404, message: 'Usuário não encontrado nesta empresa' };
    }

    // Se o e-mail mudou, verifica se já está em uso por outro
    if (user.email !== emailNormalized) {
      const emailInUse = await this.userRepository.findByEmail(emailNormalized);
      if (emailInUse) {
        throw { status: 409, message: 'E-mail já está em uso' };
      }
    }

    user.name = input.name;
    user.email = emailNormalized;
    user.role = input.role;
    user.status = input.status;

    return this.userRepository.update(user);
  }
}
