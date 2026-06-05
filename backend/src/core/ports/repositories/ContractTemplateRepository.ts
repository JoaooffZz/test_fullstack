import { ContractTemplate } from '../../domain/ContractTemplate';
import { ContractType } from '@prisma/client';

export interface ContractTemplateRepository {
  create(template: ContractTemplate): Promise<ContractTemplate>;
  findById(uuid: string, companyUuid: string): Promise<ContractTemplate | null>;
  list(companyUuid: string, type?: ContractType): Promise<ContractTemplate[]>;
}
