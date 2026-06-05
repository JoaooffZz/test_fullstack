import { prisma } from '../../infrastructure/database/prisma';
import { ContractStatus, ContractType, Prisma } from '../../generated/prisma/client';

interface GetContractsReportInput {
  companyUuid: string;
  status?: ContractStatus;
  type?: ContractType;
  startDateFrom?: Date | string;
  startDateTo?: Date | string;
}

export class GetContractsReportUseCase {
  async execute(input: GetContractsReportInput): Promise<any[]> {
    const { companyUuid, status, type, startDateFrom, startDateTo } = input;

    const where: Prisma.ContractWhereInput = {
      companyUuid,
      ...(status ? { status } : {}),
      ...(type ? { type } : {}),
      ...(startDateFrom || startDateTo
        ? {
            startDate: {
              ...(startDateFrom ? { gte: new Date(startDateFrom) } : {}),
              ...(startDateTo ? { lte: new Date(startDateTo) } : {}),
            },
          }
        : {}),
    };

    return prisma.contract.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }
}
