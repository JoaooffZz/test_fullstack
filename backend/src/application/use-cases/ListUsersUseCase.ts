import { UserRepository } from '../../core/ports/repositories/UserRepository';
import { User } from '../../core/domain/User';

export class ListUsersUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(companyUuid: string): Promise<User[]> {
    return this.userRepository.listByCompany(companyUuid);
  }
}
