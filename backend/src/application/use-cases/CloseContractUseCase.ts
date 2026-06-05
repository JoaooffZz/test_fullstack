import { ContractRepository } from '../../core/ports/repositories/ContractRepository';
import { Contract } from '../../core/domain/Contract';

interface CloseContractInput {
  uuid: string;
  companyUuid: string;
  closeReason: string;
}

export class CloseContractUseCase {
  constructor(private contractRepository: ContractRepository) {}

  async execute(input: CloseContractInput): Promise<Contract> {
    const contract = await this.contractRepository.findById(input.uuid, input.companyUuid);
    if (!contract) {
      throw { status: 404, message: 'Contrato não encontrado' };
    }

    if (contract.status !== 'ASSINADO' && contract.status !== 'VENCENDO') {
      throw { status: 400, message: 'Apenas contratos ativos (ASSINADO ou VENCENDO) podem ser encerrados' };
    }

    if (!input.closeReason || input.closeReason.trim() === '') {
      throw { status: 400, message: 'O motivo do encerramento é obrigatório' };
    }

    contract.status = 'ENCERRADO';
    contract.closeReason = input.closeReason;

    return this.contractRepository.update(contract);
  }
}
