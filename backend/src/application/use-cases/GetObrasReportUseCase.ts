import { prisma } from '../../infrastructure/database/prisma';
import { ObraStatus, Prisma } from '../../generated/prisma/client';

interface GetObrasReportInput {
  companyUuid: string;
  status?: ObraStatus;
}

export class GetObrasReportUseCase {
  async execute(input: GetObrasReportInput): Promise<any[]> {
    const { companyUuid, status } = input;

    const where: Prisma.ObraWhereInput = {
      companyUuid,
      ...(status ? { status } : {}),
    };

    const obras = await prisma.obra.findMany({
      where,
      include: {
        contract: {
          select: { title: true },
        },
        custos: {
          select: { value: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return obras.map((obra) => {
      const budget = obra.budgetTotal ? Number(obra.budgetTotal) : 0;
      const custoRealizado = obra.custos.reduce((sum, c) => sum + Number(c.value), 0);
      const saldo = budget - custoRealizado;

      return {
        name: obra.name,
        address: obra.address,
        status: obra.status,
        budget,
        custoRealizado,
        saldo,
        contractTitle: obra.contract?.title || 'Nenhum',
      };
    });
  }
}
