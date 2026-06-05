import { Request, Response } from 'express';
import { CreateObraUseCase } from '../../application/use-cases/CreateObraUseCase';
import { ListObrasUseCase } from '../../application/use-cases/ListObrasUseCase';
import { GetObraUseCase } from '../../application/use-cases/GetObraUseCase';
import { UpdateObraUseCase } from '../../application/use-cases/UpdateObraUseCase';
import { UpdateStepUseCase } from '../../application/use-cases/UpdateStepUseCase';
import { CreateVistoriaUseCase } from '../../application/use-cases/CreateVistoriaUseCase';
import { CreateCustoUseCase } from '../../application/use-cases/CreateCustoUseCase';
import { DeleteCustoUseCase } from '../../application/use-cases/DeleteCustoUseCase';

import { PrismaObraRepository } from '../repositories/PrismaObraRepository';
import { PrismaObraStepRepository } from '../repositories/PrismaObraStepRepository';
import { PrismaObraCustoRepository } from '../repositories/PrismaObraCustoRepository';
import { PrismaContractRepository } from '../repositories/PrismaContractRepository';
import { PrismaUploadRepository } from '../repositories/PrismaUploadRepository';
import { ObraStatus, ObraStepStatus, VistoriaType, CostCategory } from '../../generated/prisma/client';

const obraRepo = new PrismaObraRepository();
const stepRepo = new PrismaObraStepRepository();
const custoRepo = new PrismaObraCustoRepository();
const contractRepo = new PrismaContractRepository();
const uploadRepo = new PrismaUploadRepository();

const createObraUseCase = new CreateObraUseCase(obraRepo, stepRepo, contractRepo);
const listObrasUseCase = new ListObrasUseCase(obraRepo);
const getObraUseCase = new GetObraUseCase(obraRepo, stepRepo, custoRepo, uploadRepo);
const updateObraUseCase = new UpdateObraUseCase(obraRepo);
const updateStepUseCase = new UpdateStepUseCase(obraRepo, stepRepo);
const createVistoriaUseCase = new CreateVistoriaUseCase(obraRepo, uploadRepo);
const createCustoUseCase = new CreateCustoUseCase(obraRepo, custoRepo, uploadRepo);
const deleteCustoUseCase = new DeleteCustoUseCase(obraRepo, custoRepo);

export class ObraController {
  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const companyUuid = req.company!.uuid;
      const createdByUuid = req.user!.uuid;
      const { name, address, description, contractUuid, startDate, endDate, budgetTotal, responsibleCnpj } = req.body;

      const obra = await createObraUseCase.execute({
        companyUuid, createdByUuid, name, address, description,
        contractUuid, startDate, endDate, budgetTotal, responsibleCnpj,
      });
      res.status(201).json(obra);
    } catch (error: any) {
      res.status(error.status || 500).json({ message: error.message || 'Erro ao criar obra' });
    }
  };

  list = async (req: Request, res: Response): Promise<void> => {
    try {
      const companyUuid = req.company!.uuid;
      const { status, search } = req.query;
      const obras = await listObrasUseCase.execute({
        companyUuid,
        status: status as ObraStatus,
        search: search as string,
      });
      res.status(200).json(obras);
    } catch (error: any) {
      res.status(500).json({ message: 'Erro ao listar obras' });
    }
  };

  get = async (req: Request, res: Response): Promise<void> => {
    try {
      const companyUuid = req.company!.uuid;
      const uuid = req.params.uuid as string;
      const obra = await getObraUseCase.execute(uuid, companyUuid);
      res.status(200).json(obra);
    } catch (error: any) {
      res.status(error.status || 500).json({ message: error.message || 'Erro ao buscar obra' });
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const companyUuid = req.company!.uuid;
      const uuid = req.params.uuid as string;
      const { name, address, description, status, startDate, endDate, budgetTotal, responsibleCnpj, contractUuid } = req.body;

      const updated = await updateObraUseCase.execute({
        uuid, companyUuid, name, address, description,
        status: status as ObraStatus, startDate, endDate, budgetTotal, responsibleCnpj, contractUuid,
      });
      res.status(200).json(updated);
    } catch (error: any) {
      res.status(error.status || 500).json({ message: error.message || 'Erro ao atualizar obra' });
    }
  };

  updateStep = async (req: Request, res: Response): Promise<void> => {
    try {
      const companyUuid = req.company!.uuid;
      const obraUuid = req.params.uuid as string;
      const stepUuid = req.params.step_uuid as string;
      const { name, status, sortOrder } = req.body;

      const step = await updateStepUseCase.execute({
        stepUuid, obraUuid, companyUuid,
        name, status: status as ObraStepStatus, sortOrder,
      });
      res.status(200).json(step);
    } catch (error: any) {
      res.status(error.status || 500).json({ message: error.message || 'Erro ao atualizar etapa' });
    }
  };

  createVistoria = async (req: Request, res: Response): Promise<void> => {
    try {
      const companyUuid = req.company!.uuid;
      const createdByUuid = req.user!.uuid;
      const obraUuid = req.params.uuid as string;
      const { type, description, photos_base64 } = req.body;

      const photos = Array.isArray(photos_base64)
        ? photos_base64.map((b: any) => (typeof b === 'string' ? { base64: b } : b))
        : [];

      const vistoria = await createVistoriaUseCase.execute({
        obraUuid, companyUuid, createdByUuid,
        type: type as VistoriaType, description, photos,
      });
      res.status(201).json(vistoria);
    } catch (error: any) {
      res.status(error.status || 500).json({ message: error.message || 'Erro ao registrar vistoria' });
    }
  };

  createCusto = async (req: Request, res: Response): Promise<void> => {
    try {
      const companyUuid = req.company!.uuid;
      const createdByUuid = req.user!.uuid;
      const obraUuid = req.params.uuid as string;
      const { description, category, value, date, receipt_base64, receipt_name } = req.body;

      const custo = await createCustoUseCase.execute({
        obraUuid, companyUuid, createdByUuid,
        description, category: category as CostCategory, value, date,
        receipt: receipt_base64 ? { base64: receipt_base64, name: receipt_name } : null,
      });
      res.status(201).json(custo);
    } catch (error: any) {
      res.status(error.status || 500).json({ message: error.message || 'Erro ao lançar custo' });
    }
  };

  deleteCusto = async (req: Request, res: Response): Promise<void> => {
    try {
      const companyUuid = req.company!.uuid;
      const obraUuid = req.params.uuid as string;
      const costUuid = req.params.cost_uuid as string;

      await deleteCustoUseCase.execute({ costUuid, obraUuid, companyUuid });
      res.status(204).send();
    } catch (error: any) {
      res.status(error.status || 500).json({ message: error.message || 'Erro ao remover custo' });
    }
  };
}
