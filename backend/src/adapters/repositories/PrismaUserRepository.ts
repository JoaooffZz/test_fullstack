import { UserRepository } from '../../core/ports/repositories/UserRepository';
import { User, UserRole, UserStatus } from '../../core/domain/User';
import { prisma } from '../../infrastructure/database/prisma';

export class PrismaUserRepository implements UserRepository {
  private toDomain(record: {
    uuid: string;
    createdAt: Date;
    updatedAt: Date;
    companyUuid: string;
    name: string;
    email: string;
    passwordHash: string;
    role: string;
    status: string;
  }): User {
    return new User({
      uuid: record.uuid,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      companyUuid: record.companyUuid,
      name: record.name,
      email: record.email,
      passwordHash: record.passwordHash,
      role: record.role as UserRole,
      status: record.status as UserStatus,
    });
  }

  async create(user: User): Promise<User> {
    const created = await prisma.user.create({
      data: {
        companyUuid: user.companyUuid,
        name: user.name,
        email: user.email,
        passwordHash: user.passwordHash,
        role: user.role,
        status: user.status,
      },
    });

    return this.toDomain(created);
  }

  async findByEmail(email: string): Promise<User | null> {
    const record = await prisma.user.findFirst({
      where: { email: email.toLowerCase().trim() },
    });

    if (!record) return null;
    return this.toDomain(record);
  }

  async findByEmailAndCompany(email: string, companyUuid: string): Promise<User | null> {
    const record = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase().trim(),
        companyUuid,
      },
    });

    if (!record) return null;
    return this.toDomain(record);
  }

  async findById(uuid: string, companyUuid: string): Promise<User | null> {
    const record = await prisma.user.findFirst({
      where: { uuid, companyUuid },
    });

    if (!record) return null;
    return this.toDomain(record);
  }

  async listByCompany(companyUuid: string): Promise<User[]> {
    const records = await prisma.user.findMany({
      where: { companyUuid },
      orderBy: { createdAt: 'asc' },
    });

    return records.map((r) => this.toDomain(r));
  }

  async update(user: User): Promise<User> {
    if (!user.uuid) {
      throw new Error('UUID do usuário é obrigatório para atualização');
    }

    const updated = await prisma.user.update({
      where: { uuid: user.uuid },
      data: {
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });

    return this.toDomain(updated);
  }
}
