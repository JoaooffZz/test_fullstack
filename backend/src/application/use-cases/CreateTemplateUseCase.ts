import { ContractTemplateRepository } from '../../core/ports/repositories/ContractTemplateRepository';
import { ContractTemplate, ContractTemplateFieldProps } from '../../core/domain/ContractTemplate';
import { ContractType } from '../../generated/prisma/client';

interface CreateTemplateInput {
  companyUuid: string;
  name: string;
  type: ContractType;
  description?: string | null;
  body: string;
  fields: ContractTemplateFieldProps[];
}

export class CreateTemplateUseCase {
  constructor(private templateRepository: ContractTemplateRepository) {}

  async execute(input: CreateTemplateInput): Promise<ContractTemplate> {
    const template = new ContractTemplate({
      companyUuid: input.companyUuid,
      name: input.name,
      type: input.type,
      description: input.description,
      body: input.body,
      fields: input.fields,
    });

    return this.templateRepository.create(template);
  }
}
