import { Request, Response } from 'express';
import { CreateTemplateUseCase } from '../../application/use-cases/CreateTemplateUseCase';
import { PrismaContractTemplateRepository } from '../repositories/PrismaContractTemplateRepository';
import { ContractType } from '@prisma/client';

const templateRepository = new PrismaContractTemplateRepository();
const createTemplateUseCase = new CreateTemplateUseCase(templateRepository);

export class TemplateController {
  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const companyUuid = req.company!.uuid;
      const { name, type, description, body, fields } = req.body;

      const created = await createTemplateUseCase.execute({
        companyUuid,
        name,
        type: type as ContractType,
        description,
        body,
        fields: (fields || []).map((f: any) => ({
          key: f.key,
          label: f.label,
          fieldType: f.fieldType || f.type,
          isRequired: f.isRequired !== undefined ? f.isRequired : f.required,
          sortOrder: f.sortOrder,
        })),
      });

      res.status(201).json(created);
    } catch (error: any) {
      const status = error.status || 500;
      const message = error.message || 'Erro interno do servidor';
      res.status(status).json({ message });
    }
  };

  list = async (req: Request, res: Response): Promise<void> => {
    try {
      const companyUuid = req.company!.uuid;
      const type = req.query.type as ContractType | undefined;

      const list = await templateRepository.list(companyUuid, type);
      res.status(200).json(list);
    } catch (error: any) {
      res.status(500).json({ message: 'Erro ao listar templates de contrato' });
    }
  };

  get = async (req: Request, res: Response): Promise<void> => {
    try {
      const companyUuid = req.company!.uuid;
      const { uuid } = req.params as any;

      const template = await templateRepository.findById(uuid, companyUuid);
      if (!template) {
        res.status(404).json({ message: 'Template de contrato não encontrado' });
        return;
      }

      res.status(200).json(template);
    } catch (error: any) {
      res.status(500).json({ message: 'Erro ao buscar template de contrato' });
    }
  };
}
