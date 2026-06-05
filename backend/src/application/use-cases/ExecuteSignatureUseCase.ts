import { SignatureRequestRepository } from '../../core/ports/repositories/SignatureRequestRepository';
import { ContractRepository } from '../../core/ports/repositories/ContractRepository';
import { AuditRepository } from '../../core/ports/repositories/AuditRepository';

interface ExecuteSignatureInput {
  token: string;
  name: string;
  ipAddress: string;
}

export class ExecuteSignatureUseCase {
  constructor(
    private signatureRequestRepository: SignatureRequestRepository,
    private contractRepository: ContractRepository,
    private auditRepository: AuditRepository,
  ) {}

  async execute(input: ExecuteSignatureInput): Promise<void> {
    if (!input.name || input.name.trim() === '') {
      throw { status: 400, message: 'O nome do assinante é obrigatório' };
    }

    const request = await this.signatureRequestRepository.findByToken(input.token);
    if (!request) {
      throw { status: 404, message: 'Solicitação de assinatura não encontrada' };
    }

    if (request.status === 'ASSINADO') {
      throw { status: 400, message: 'Este contrato já foi assinado' };
    }

    if (request.isExpired()) {
      throw { status: 410, message: 'O link de assinatura expirou' };
    }

    const contract = await this.contractRepository.findByIdWithoutCompany(request.contractUuid);
    if (!contract) {
      throw { status: 404, message: 'Contrato associado não encontrado' };
    }

    // Atualizar a solicitação de assinatura
    request.status = 'ASSINADO';
    request.signedAt = new Date();
    request.signerName = input.name;
    request.signerIp = input.ipAddress;

    await this.signatureRequestRepository.update(request);

    // Registrar log de auditoria
    await this.auditRepository.create({
      companyUuid: contract.companyUuid,
      action: 'SIGN',
      entityType: 'contract',
      entityUuid: contract.uuid!,
      description: `Contrato assinado eletronicamente por ${input.name} via ${request.channel}`,
      ipAddress: input.ipAddress,
      metadata: {
        token: request.token,
        channel: request.channel,
        signerName: input.name,
      },
    });
  }
}
