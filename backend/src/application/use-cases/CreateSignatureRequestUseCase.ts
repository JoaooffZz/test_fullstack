import { ContractRepository } from '../../core/ports/repositories/ContractRepository';
import { SignatureRequestRepository } from '../../core/ports/repositories/SignatureRequestRepository';
import { SignatureRequest } from '../../core/domain/SignatureRequest';
import { NotificationService } from '../../infrastructure/services/NotificationService';
import { SignatureChannel } from '../../generated/prisma/client';
import crypto from 'crypto';

interface CreateSignatureRequestInput {
  contractUuid: string;
  companyUuid: string;
  channel: SignatureChannel;
  expiresInDays?: number;
}

export class CreateSignatureRequestUseCase {
  constructor(
    private contractRepository: ContractRepository,
    private signatureRequestRepository: SignatureRequestRepository,
  ) {}

  async execute(input: CreateSignatureRequestInput): Promise<{ token: string; link: string; signatureUrl: string }> {
    const contract = await this.contractRepository.findById(input.contractUuid, input.companyUuid);
    if (!contract) {
      throw { status: 404, message: 'Contrato não encontrado' };
    }

    // O contrato deve estar em status RASCUNHO ou AGUARDANDO_ASSINATURA
    if (contract.status !== 'RASCUNHO' && contract.status !== 'AGUARDANDO_ASSINATURA') {
      throw { status: 400, message: 'Apenas contratos em RASCUNHO ou AGUARDANDO_ASSINATURA podem ter solicitações de assinatura enviadas' };
    }

    const token = crypto.randomUUID();
    const days = input.expiresInDays || 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    // Salvar solicitação
    const request = new SignatureRequest({
      contractUuid: contract.uuid!,
      channel: input.channel,
      status: 'ENVIADO',
      token,
      expiresAt,
    });

    await this.signatureRequestRepository.create(request);

    // Mudar status do contrato
    contract.status = 'AGUARDANDO_ASSINATURA';
    await this.contractRepository.update(contract);

    // Disparar notificação (mock)
    NotificationService.sendSignatureNotification(
      input.channel,
      contract.relatedPartyEmail,
      contract.relatedPartyWhatsapp,
      contract.title,
      token,
    );

    const link = `http://localhost:5173/assinar/${token}`;

    return {
      token,
      link,
      signatureUrl: link,
    };
  }
}
