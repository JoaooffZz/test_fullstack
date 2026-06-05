import { ContractRepository } from '../../core/ports/repositories/ContractRepository';
import { Contract } from '../../core/domain/Contract';
import { ContractType } from '../../generated/prisma/client';

interface UpdateContractInput {
  uuid: string;
  companyUuid: string;
  title: string;
  type: ContractType;
  relatedParty: string;
  relatedPartyEmail: string;
  relatedPartyWhatsapp?: string | null;
  value?: number | null;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  body: string;
}

export class UpdateContractUseCase {
  constructor(private contractRepository: ContractRepository) {}

  async execute(input: UpdateContractInput): Promise<Contract> {
    const contract = await this.contractRepository.findById(input.uuid, input.companyUuid);
    if (!contract) {
      throw { status: 404, message: 'Contrato não encontrado' };
    }

    // Regra de Negócio: Bloquear edição se não for RASCUNHO
    if (contract.status !== 'RASCUNHO') {
      throw { status: 400, message: 'Não é permitido editar contratos que não estejam no status de RASCUNHO' };
    }

    contract.title = input.title;
    contract.type = input.type;
    contract.relatedParty = input.relatedParty;
    contract.relatedPartyEmail = input.relatedPartyEmail;
    contract.relatedPartyWhatsapp = input.relatedPartyWhatsapp ?? null;
    contract.value = input.value ?? null;
    contract.startDate = input.startDate ? new Date(input.startDate) : null;
    contract.endDate = input.endDate ? new Date(input.endDate) : null;
    contract.body = input.body;

    return this.contractRepository.update(contract);
  }
}
