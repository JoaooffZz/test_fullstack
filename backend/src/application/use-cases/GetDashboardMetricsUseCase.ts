import { prisma } from '../../infrastructure/database/prisma';

interface GetDashboardMetricsInput {
  companyUuid: string;
}

export class GetDashboardMetricsUseCase {
  async execute(input: GetDashboardMetricsInput): Promise<any> {
    const { companyUuid } = input;

    // Métricas de Contratos
    const [
      contratosTotal,
      contratosAssinados,
      contratosAguardando,
      contratosEncerrados,
      contratosVencendo30Dias,
    ] = await Promise.all([
      prisma.contract.count({ where: { companyUuid } }),
      prisma.contract.count({ where: { companyUuid, status: 'ASSINADO' } }),
      prisma.contract.count({ where: { companyUuid, status: 'AGUARDANDO_ASSINATURA' } }),
      prisma.contract.count({ where: { companyUuid, status: 'ENCERRADO' } }),
      prisma.contract.count({
        where: {
          companyUuid,
          status: 'VENCENDO',
        },
      }),
    ]);

    // Métricas de Obras
    const [
      obrasTotal,
      obrasExecucao,
      obrasConcluidas,
      obrasBudgets,
      custosTotal,
    ] = await Promise.all([
      prisma.obra.count({ where: { companyUuid } }),
      prisma.obra.count({ where: { companyUuid, status: 'EM_EXECUCAO' } }),
      prisma.obra.count({ where: { companyUuid, status: 'CONCLUIDA' } }),
      prisma.obra.aggregate({
        where: { companyUuid },
        _sum: { budgetTotal: true },
      }),
      prisma.obraCusto.aggregate({
        where: {
          obra: { companyUuid },
        },
        _sum: { value: true },
      }),
    ]);

    // Métricas de O.C.s
    const [
      ocTotal,
      ocEmitidas,
    ] = await Promise.all([
      prisma.purchaseOrder.count({ where: { companyUuid } }),
      prisma.purchaseOrder.count({ where: { companyUuid, status: 'EMITIDA' } }),
    ]);

    // Listagens Recentes (últimos 5)
    const [recentContracts, recentObras] = await Promise.all([
      prisma.contract.findMany({
        where: { companyUuid },
        orderBy: { updatedAt: 'desc' },
        take: 5,
      }),
      prisma.obra.findMany({
        where: { companyUuid },
        orderBy: { updatedAt: 'desc' },
        take: 5,
      }),
    ]);

    return {
      contracts: {
        total: contratosTotal,
        ativos: contratosAssinados,
        vencendo30d: contratosVencendo30Dias,
        aguardandoAssinatura: contratosAguardando,
        encerrados: contratosEncerrados,
      },
      obras: {
        total: obrasTotal,
        emExecucao: obrasExecucao,
        concluidas: obrasConcluidas,
        orcamentoConsolidado: obrasBudgets._sum.budgetTotal ? Number(obrasBudgets._sum.budgetTotal) / 100 : 0,
        custoRealizadoConsolidado: custosTotal._sum.value ? Number(custosTotal._sum.value) / 100 : 0,
      },
      purchaseOrders: {
        total: ocTotal,
        aguardandoAprovacao: ocEmitidas,
      },
      recentContracts,
      recentObras,
    };
  }
}
