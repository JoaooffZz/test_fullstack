import { ContractRepository } from '../../core/ports/repositories/ContractRepository';
import { Contract } from '../../core/domain/Contract';

interface CreateAdditiveInput {
  originContractUuid: string;
  companyUuid: string;
  createdByUuid?: string | null;
  title?: string; // Título opcional customizado para o aditivo
  descriptionOfChanges: string; // Descrição das alterações do aditivo a ser concatenada
}

export class CreateAdditiveUseCase {
  constructor(private contractRepository: ContractRepository) {}

  async execute(input: CreateAdditiveInput): Promise<Contract> {
    const parent = await this.contractRepository.findById(input.originContractUuid, input.companyUuid);
    if (!parent) {
      throw { status: 404, message: 'Contrato de origem não encontrado' };
    }

    if (parent.status !== 'ASSINADO' && parent.status !== 'VENCENDO') {
      throw { status: 400, message: 'O contrato de origem deve estar ASSINADO ou VENCENDO para a criação de um aditivo' };
    }

    if (!input.descriptionOfChanges || input.descriptionOfChanges.trim() === '') {
      throw { status: 400, message: 'A descrição das alterações do aditivo é obrigatória' };
    }

    const title = input.title || `Aditivo — ${parent.title}`;

    const additiveBody = `
# TERMO ADITIVO

Este termo aditivo altera o contrato original: **${parent.title}** (Ref: ${parent.uuid}).

## Modificações Acordadas
${input.descriptionOfChanges}

---

## Termos Gerais
Todas as demais cláusulas e condições do contrato original que não foram alteradas por este termo permanecem em pleno vigor.
    `.trim();

    const additive = new Contract({
      companyUuid: input.companyUuid,
      templateUuid: null, // aditivos geralmente não derivam de templates de contratos comuns
      createdByUuid: input.createdByUuid,
      title,
      type: parent.type,
      status: 'RASCUNHO',
      relatedParty: parent.relatedParty,
      relatedPartyEmail: parent.relatedPartyEmail,
      relatedPartyWhatsapp: parent.relatedPartyWhatsapp,
      value: parent.value,
      startDate: parent.startDate,
      endDate: parent.endDate,
      body: additiveBody,
      originContractUuid: parent.uuid,
    });

    return this.contractRepository.create(additive);
  }
}
