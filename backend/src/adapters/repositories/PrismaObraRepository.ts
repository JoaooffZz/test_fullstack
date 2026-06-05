import { ObraRepository, ListObrasFilter } from '../../core/ports/repositories/ObraRepository';
import { Obra } from '../../core/domain/Obra';
import { prisma } from '../../infrastructure/database/prisma';
import { ObraStatus, Prisma } from '../../generated/prisma/client';

export class PrismaObraRepository implements ObraRepository {
  private toDomain(record: any): Obra {
    return new Obra({
      uuid: record.uuid,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      companyUuid: record.companyUuid,
      contractUuid: record.contractUuid,
      createdByUuid: record.createdByUuid,
      name: record.name,
      address: record.address,
      description: record.description,
      status: record.status as ObraStatus,
      startDate: record.startDate,
      endDate: record.endDate,
      budgetTotal: record.budgetTotal !== null ? Number(record.budgetTotal) / 100 : null,
      responsibleCnpj: record.responsibleCnpj,
    });
  }

  async create(obra: Obra): Promise<Obra> {
    const record = await prisma.obra.create({
      data: {
        companyUuid: obra.companyUuid,
        contractUuid: obra.contractUuid,
        createdByUuid: obra.createdByUuid,
        name: obra.name,
        address: obra.address,
        description: obra.description,
        status: obra.status,
        startDate: obra.startDate,
        endDate: obra.endDate,
        budgetTotal: obra.budgetTotal !== null ? BigInt(Math.round(Number(obra.budgetTotal) * 100)) : null,
        responsibleCnpj: obra.responsibleCnpj,
      },
    });
    return this.toDomain(record);
  }

  async update(obra: Obra): Promise<Obra> {
    if (!obra.uuid) throw new Error('UUID da obra é obrigatório para atualização');
    const record = await prisma.obra.update({
      where: { uuid: obra.uuid },
      data: {
        name: obra.name,
        address: obra.address,
        description: obra.description,
        status: obra.status,
        startDate: obra.startDate,
        endDate: obra.endDate,
        budgetTotal: obra.budgetTotal !== null ? BigInt(Math.round(Number(obra.budgetTotal) * 100)) : null,
        responsibleCnpj: obra.responsibleCnpj,
        contractUuid: obra.contractUuid,
      },
    });
    return this.toDomain(record);
  }

  async findById(uuid: string, companyUuid: string): Promise<Obra | null> {
    const record = await prisma.obra.findFirst({
      where: { uuid, companyUuid },
    });
    if (!record) return null;
    return this.toDomain(record);
  }

  async list(companyUuid: string, filter: ListObrasFilter): Promise<Obra[]> {
    const where: Prisma.ObraWhereInput = {
      companyUuid,
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.search
        ? {
            OR: [
              { name: { contains: filter.search, mode: 'insensitive' } },
              { address: { contains: filter.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const records = await prisma.obra.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return records.map((r) => this.toDomain(r));
  }

  async sumCosts(obraUuid: string): Promise<number> {
    const result = await prisma.obraCusto.aggregate({
      where: { obraUuid },
      _sum: { value: true },
    });
    return result._sum.value !== null ? Number(result._sum.value) / 100 : 0;
  }
}
