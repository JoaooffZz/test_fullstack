import { ContractRepository } from '../../core/ports/repositories/ContractRepository';
import { ContractTemplateRepository } from '../../core/ports/repositories/ContractTemplateRepository';
import { UploadRepository } from '../../core/ports/repositories/UploadRepository';
import { Contract } from '../../core/domain/Contract';
import { UploadService } from '../../infrastructure/services/UploadService';
import { ContractType } from '../../generated/prisma/client';

interface AttachmentInput {
  base64: string;
  name?: string;
}

interface CreateContractInput {
  companyUuid: string;
  createdByUuid?: string | null;
  templateUuid?: string | null;
  title: string;
  type: ContractType;
  relatedParty: string;
  relatedPartyEmail: string;
  relatedPartyWhatsapp?: string | null;
  value?: number | null;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  body?: string | null; // opcional se usar template
  fieldValues?: Record<string, any> | null;
  files?: AttachmentInput[];
}

export class CreateContractUseCase {
  constructor(
    private contractRepository: ContractRepository,
    private templateRepository: ContractTemplateRepository,
    private uploadRepository: UploadRepository,
  ) {}

  async execute(input: CreateContractInput): Promise<Contract> {
    let finalBody = input.body || '';

    // Se tiver template, carregar e substituir variáveis
    if (input.templateUuid) {
      const template = await this.templateRepository.findById(input.templateUuid, input.companyUuid);
      if (!template) {
        throw { status: 404, message: 'Template de contrato não encontrado' };
      }

      // Validar e preencher placeholders
      const values = input.fieldValues || {};
      
      // Validar se todos os campos requeridos do template estão presentes
      for (const field of template.fields) {
        if (field.isRequired && (values[field.key] === undefined || values[field.key] === null || values[field.key] === '')) {
          throw { status: 400, message: `O campo obrigatório "${field.label}" (${field.key}) não foi preenchido` };
        }
      }

      finalBody = Contract.fillTemplate(template.body, values);
    } else {
      if (!finalBody || finalBody.trim() === '') {
        throw { status: 400, message: 'O corpo do contrato é obrigatório quando não se utiliza um template' };
      }
    }

    const contract = new Contract({
      companyUuid: input.companyUuid,
      templateUuid: input.templateUuid,
      createdByUuid: input.createdByUuid,
      title: input.title,
      type: input.type,
      status: 'RASCUNHO',
      relatedParty: input.relatedParty,
      relatedPartyEmail: input.relatedPartyEmail,
      relatedPartyWhatsapp: input.relatedPartyWhatsapp,
      value: input.value,
      startDate: input.startDate ? new Date(input.startDate) : null,
      endDate: input.endDate ? new Date(input.endDate) : null,
      body: finalBody,
      fieldValues: input.fieldValues,
    });

    const createdContract = await this.contractRepository.create(contract);

    // Salvar anexos caso existam
    if (input.files && input.files.length > 0) {
      for (const file of input.files) {
        try {
          const fileInfo = UploadService.saveBase64(file.base64, file.name);
          await this.uploadRepository.create({
            companyUuid: input.companyUuid,
            entityType: 'contract',
            entityUuid: createdContract.uuid!,
            fileName: fileInfo.fileName,
            fileUrl: fileInfo.fileUrl,
            mimeType: fileInfo.mimeType,
            sizeBytes: fileInfo.sizeBytes,
          });
        } catch (uploadError: any) {
          console.error('Erro ao processar anexo:', uploadError);
          // Opcionalmente podemos lançar um erro ou ignorar e continuar
        }
      }
    }

    return createdContract;
  }
}
