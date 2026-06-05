import { Request, Response } from 'express';
import { GetDashboardMetricsUseCase } from '../../application/use-cases/GetDashboardMetricsUseCase';

const getMetricsUseCase = new GetDashboardMetricsUseCase();

export class DashboardController {
  getMetrics = async (req: Request, res: Response): Promise<void> => {
    try {
      const companyUuid = req.company!.uuid;
      const metrics = await getMetricsUseCase.execute({ companyUuid });
      res.status(200).json(metrics);
    } catch (error: any) {
      res.status(error.status || 500).json({ message: error.message || 'Erro ao carregar métricas do dashboard' });
    }
  };
}
