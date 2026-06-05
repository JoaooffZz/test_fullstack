import { ContractRepository, ListContractsFilter, PaginatedContracts } from '../../core/ports/repositories/ContractRepository';
import { Contract } from '../../core/domain/Contract';
import { prisma } from '../../infrastructure/database/prisma';
import { ContractType, ContractStatus, Prisma } from '../../generated/prisma/client';

export class PrismaContractRepository implements ContractRepository {
  private toDomain(record: {
    uuid: string;
    createdAt: Date;
    updatedAt: Date;
    companyUuid: string;
    templateUuid: string | null;
    createdByUuid: string | null;
    title: string;
    type: ContractType;
    status: ContractStatus;
    relatedParty: string;
    relatedPartyEmail: string;
    relatedPartyWhatsapp: string | null;
    value: bigint | null;
    startDate: Date | null;
    endDate: Date | null;
    body: string;
    fieldValues: any;
    closeReason: string | null;
    originContractUuid: string | null;
  }): Contract {
    return new Contract({
      uuid: record.uuid,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      companyUuid: record.companyUuid,
      templateUuid: record.templateUuid,
      createdByUuid: record.createdByUuid,
      title: record.title,
      type: record.type,
      status: record.status,
      relatedParty: record.relatedParty,
      relatedPartyEmail: record.relatedPartyEmail,
      relatedPartyWhatsapp: record.relatedPartyWhatsapp,
      value: record.value !== null ? Number(record.value) : null,
      startDate: record.startDate,
      endDate: record.endDate,
      body: record.body,
      fieldValues: record.fieldValues as Record<string, any>,
      closeReason: record.closeReason,
      originContractUuid: record.originContractUuid,
    });
  }

  async create(contract: Contract): Promise<Contract> {
    const record = await prisma.contract.create({
      data: {
        companyUuid: contract.companyUuid,
        templateUuid: contract.templateUuid,
        createdByUuid: contract.createdByUuid,
        title: contract.title,
        type: contract.type,
        status: contract.status,
        relatedParty: contract.relatedParty,
        relatedPartyEmail: contract.relatedPartyEmail,
        relatedPartyWhatsapp: contract.relatedPartyWhatsapp,
        value: contract.value !== null ? BigInt(contract.value) : null,
        startDate: contract.startDate,
        endDate: contract.endDate,
        body: contract.body,
        fieldValues: contract.fieldValues ?? undefined,
        originContractUuid: contract.originContractUuid,
      },
    });

    return this.toDomain(record);
  }

  async update(contract: Contract): Promise<Contract> {
    if (!contract.uuid) {
      throw new Error('UUID do contrato é obrigatório para atualização');
    }

    const record = await prisma.contract.update({
      where: { uuid: contract.uuid },
      data: {
        title: contract.title,
        type: contract.type,
        status: contract.status,
        relatedParty: contract.relatedParty,
        relatedPartyEmail: contract.relatedPartyEmail,
        relatedPartyWhatsapp: contract.relatedPartyWhatsapp,
        value: contract.value !== null ? BigInt(contract.value) : null,
        startDate: contract.startDate,
        endDate: contract.endDate,
        body: contract.body,
        fieldValues: contract.fieldValues ?? undefined,
        closeReason: contract.closeReason,
      },
    });

    return this.toDomain(record);
  }

  async findById(uuid: string, companyUuid: string): Promise<Contract | null> {
    const record = await prisma.contract.findFirst({
      where: { uuid, companyUuid },
    });

    if (!record) return null;
    return this.toDomain(record);
  }

  async findByIdWithoutCompany(uuid: string): Promise<Contract | null> {
    const record = await prisma.contract.findUnique({
      where: { uuid },
    });

    if (!record) return null;
    return this.toDomain(record);
  }

  async list(companyUuid: string, filters: ListContractsFilter): Promise<PaginatedContracts> {
    const { status, type, search, page, limit } = filters;
    const skip = (page - 1) * limit;

    const whereClause: Prisma.ContractWhereInput = {
      companyUuid,
      ...(status ? { status } : {}),
      ...(type ? { type } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { relatedParty: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [records, total] = await prisma.$transaction([
      prisma.contract.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.contract.count({
        where: whereClause,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: records.map((r) => this.toDomain(r)),
      total,
      page,
      limit,
      totalPages,
    };
  }
}
