import { Request, Response } from 'express';
import { GetContractsReportUseCase } from '../../application/use-cases/GetContractsReportUseCase';
import { GetObrasReportUseCase } from '../../application/use-cases/GetObrasReportUseCase';
import { CsvHelper } from '../../utils/csvHelper';
import { ContractStatus, ContractType, ObraStatus } from '../../generated/prisma/client';

const getContractsUseCase = new GetContractsReportUseCase();
const getObrasUseCase = new GetObrasReportUseCase();

export class ReportController {
  contracts = async (req: Request, res: Response): Promise<void> => {
    try {
      const companyUuid = req.company!.uuid;
      const { format, status, type, start_date_from, start_date_to } = req.query;

      const contracts = await getContractsUseCase.execute({
        companyUuid,
        status: status as ContractStatus,
        type: type as ContractType,
        startDateFrom: start_date_from as string,
        startDateTo: start_date_to as string,
      });

      if (format === 'csv') {
        const headers = [
          'ID',
          'Título',
          'Tipo',
          'Status',
          'Parte Relacionada',
          'Valor',
          'Início de Vigência',
          'Fim de Vigência',
        ];

        const formatMoney = (val: any): string => {
          if (!val) return 'R$ 0,00';
          const reais = Number(val) / 100;
          return reais.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        };

        const formatDate = (date: any): string => {
          if (!date) return '';
          return new Date(date).toLocaleDateString('pt-BR');
        };

        const rows = contracts.map((c) => [
          c.uuid || '',
          c.title || '',
          c.type || '',
          c.status || '',
          c.relatedParty || '',
          formatMoney(c.value),
          formatDate(c.startDate),
          formatDate(c.endDate),
        ]);

        const csvContent = CsvHelper.toCsv(headers, rows);

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="relatorio_contratos.csv"');
        res.status(200).send(csvContent);
        return;
      }

      res.status(200).json(contracts);
    } catch (error: any) {
      res.status(500).json({ message: 'Erro ao gerar relatório de contratos' });
    }
  };

  obras = async (req: Request, res: Response): Promise<void> => {
    try {
      const companyUuid = req.company!.uuid;
      const { format, status } = req.query;

      const obras = await getObrasUseCase.execute({
        companyUuid,
        status: status as ObraStatus,
      });

      if (format === 'csv') {
        const headers = [
          'Nome',
          'Endereço',
          'Status',
          'Orçamento Previsto',
          'Custo Realizado',
          'Saldo Orçamentário',
          'Contrato Vinculado',
        ];

        const formatMoney = (val: number): string => {
          const reais = val / 100;
          return reais.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        };

        const rows = obras.map((o) => [
          o.name || '',
          o.address || '',
          o.status || '',
          formatMoney(o.budget),
          formatMoney(o.custoRealizado),
          formatMoney(o.saldo),
          o.contractTitle || 'Nenhum',
        ]);

        const csvContent = CsvHelper.toCsv(headers, rows);

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="relatorio_obras.csv"');
        res.status(200).send(csvContent);
        return;
      }

      res.status(200).json(obras);
    } catch (error: any) {
      res.status(500).json({ message: 'Erro ao gerar relatório de obras' });
    }
  };
}
