import { Request, Response } from 'express';
import { CreateContractUseCase } from '../../application/use-cases/CreateContractUseCase';
import { ListContractsUseCase } from '../../application/use-cases/ListContractsUseCase';
import { GetContractUseCase } from '../../application/use-cases/GetContractUseCase';
import { UpdateContractUseCase } from '../../application/use-cases/UpdateContractUseCase';
import { CloseContractUseCase } from '../../application/use-cases/CloseContractUseCase';
import { CreateAdditiveUseCase } from '../../application/use-cases/CreateAdditiveUseCase';

import { PrismaContractRepository } from '../repositories/PrismaContractRepository';
import { PrismaContractTemplateRepository } from '../repositories/PrismaContractTemplateRepository';
import { PrismaUploadRepository } from '../repositories/PrismaUploadRepository';
import { ContractType, ContractStatus } from '@prisma/client';

const contractRepository = new PrismaContractRepository();
const templateRepository = new PrismaContractTemplateRepository();
const uploadRepository = new PrismaUploadRepository();

const createContractUseCase = new CreateContractUseCase(contractRepository, templateRepository, uploadRepository);
const listContractsUseCase = new ListContractsUseCase(contractRepository);
const getContractUseCase = new GetContractUseCase(contractRepository, uploadRepository);
const updateContractUseCase = new UpdateContractUseCase(contractRepository);
const closeContractUseCase = new CloseContractUseCase(contractRepository);
const createAdditiveUseCase = new CreateAdditiveUseCase(contractRepository);

export class ContractController {
  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const companyUuid = req.company!.uuid;
      const createdByUuid = req.user!.uuid;
      const {
        templateUuid,
        title,
        type,
        relatedParty,
        relatedPartyEmail,
        relatedPartyWhatsapp,
        value,
        startDate,
        endDate,
        body,
        fieldValues,
        files,
      } = req.body;

      const contract = await createContractUseCase.execute({
        companyUuid,
        createdByUuid,
        templateUuid,
        title,
        type: type as ContractType,
        relatedParty,
        relatedPartyEmail,
        relatedPartyWhatsapp,
        value,
        startDate,
        endDate,
        body,
        fieldValues,
        files,
      });

      res.status(201).json(contract);
    } catch (error: any) {
      const status = error.status || 500;
      const message = error.message || 'Erro interno ao criar contrato';
      res.status(status).json({ message });
    }
  };

  list = async (req: Request, res: Response): Promise<void> => {
    try {
      const companyUuid = req.company!.uuid;
      const { status, type, search, page, limit } = req.query;

      const parsedPage = page ? parseInt(page as string, 10) : 1;
      const parsedLimit = limit ? parseInt(limit as string, 10) : 10;

      const result = await listContractsUseCase.execute({
        companyUuid,
        status: status as ContractStatus,
        type: type as ContractType,
        search: search as string,
        page: parsedPage,
        limit: parsedLimit,
      });

      res.status(200).json(result);
    } catch (error: any) {
      res.status(500).json({ message: 'Erro ao listar contratos' });
    }
  };

  get = async (req: Request, res: Response): Promise<void> => {
    try {
      const companyUuid = req.company!.uuid;
      const { uuid } = req.params as any;

      const result = await getContractUseCase.execute(uuid, companyUuid);
      res.status(200).json(result);
    } catch (error: any) {
      const status = error.status || 500;
      const message = error.message || 'Erro ao buscar detalhes do contrato';
      res.status(status).json({ message });
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const companyUuid = req.company!.uuid;
      const { uuid } = req.params as any;
      const { title, type, relatedParty, relatedPartyEmail, relatedPartyWhatsapp, value, startDate, endDate, body } = req.body;

      const updated = await updateContractUseCase.execute({
        uuid,
        companyUuid,
        title,
        type: type as ContractType,
        relatedParty,
        relatedPartyEmail,
        relatedPartyWhatsapp,
        value,
        startDate,
        endDate,
        body,
      });

      res.status(200).json(updated);
    } catch (error: any) {
      const status = error.status || 500;
      const message = error.message || 'Erro ao atualizar contrato';
      res.status(status).json({ message });
    }
  };

  close = async (req: Request, res: Response): Promise<void> => {
    try {
      const companyUuid = req.company!.uuid;
      const { uuid } = req.params as any;
      const { close_reason } = req.body;

      const closed = await closeContractUseCase.execute({
        uuid,
        companyUuid,
        closeReason: close_reason,
      });

      res.status(200).json(closed);
    } catch (error: any) {
      const status = error.status || 500;
      const message = error.message || 'Erro ao encerrar contrato';
      res.status(status).json({ message });
    }
  };

  additive = async (req: Request, res: Response): Promise<void> => {
    try {
      const companyUuid = req.company!.uuid;
      const createdByUuid = req.user!.uuid;
      const { uuid } = req.params as any;
      const { title, description_of_changes } = req.body;

      const additive = await createAdditiveUseCase.execute({
        originContractUuid: uuid,
        companyUuid,
        createdByUuid,
        title,
        descriptionOfChanges: description_of_changes,
      });

      res.status(201).json(additive);
    } catch (error: any) {
      const status = error.status || 500;
      const message = error.message || 'Erro ao gerar termo aditivo';
      res.status(status).json({ message });
    }
  };
}
