import { CompanyRepository } from '../../core/ports/repositories/CompanyRepository';
import { Company } from '../../core/domain/Company';
import { prisma } from '../../infrastructure/database/prisma';

export class PrismaCompanyRepository implements CompanyRepository {
  async create(company: Company): Promise<Company> {
    const created = await prisma.company.create({
      data: {
        name: company.name,
        cnpj: company.cnpj,
        email: company.email,
        phone: company.phone,
        address: company.address,
        isActive: company.isActive,
      },
    });

    return new Company({
      uuid: created.uuid,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
      name: created.name,
      cnpj: created.cnpj,
      email: created.email,
      phone: created.phone,
      address: created.address,
      isActive: created.isActive,
    });
  }

  async findByCnpj(cnpj: string): Promise<Company | null> {
    const record = await prisma.company.findUnique({
      where: { cnpj },
    });

    if (!record) return null;

    return new Company({
      uuid: record.uuid,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      name: record.name,
      cnpj: record.cnpj,
      email: record.email,
      phone: record.phone,
      address: record.address,
      isActive: record.isActive,
    });
  }

  async findById(uuid: string): Promise<Company | null> {
    const record = await prisma.company.findUnique({
      where: { uuid },
    });

    if (!record) return null;

    return new Company({
      uuid: record.uuid,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      name: record.name,
      cnpj: record.cnpj,
      email: record.email,
      phone: record.phone,
      address: record.address,
      isActive: record.isActive,
    });
  }
}
