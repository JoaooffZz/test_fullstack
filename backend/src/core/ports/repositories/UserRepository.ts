import { User } from '../../domain/User';

export interface UserRepository {
  create(user: User): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findByEmailAndCompany(email: string, companyUuid: string): Promise<User | null>;
  findById(uuid: string, companyUuid: string): Promise<User | null>;
  listByCompany(companyUuid: string): Promise<User[]>;
  update(user: User): Promise<User>;
}
