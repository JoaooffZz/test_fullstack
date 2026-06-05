import { SignatureRequestRepository } from '../../core/ports/repositories/SignatureRequestRepository';
import { ContractRepository } from '../../core/ports/repositories/ContractRepository';

interface ValidatedTokenOutput {
  contract: {
    uuid: string;
    title: string;
    body: string;
    type: string;
    relatedParty: string;
    relatedPartyEmail: string;
    value: number | null;
  };
  request: {
    uuid: string;
    status: string;
    expiresAt: Date;
    signerName: string | null;
    signedAt: Date | null;
  };
}

export class ValidateSignatureTokenUseCase {
  constructor(
    private signatureRequestRepository: SignatureRequestRepository,
    private contractRepository: ContractRepository,
  ) {}

  async execute(token: string): Promise<ValidatedTokenOutput> {
    const request = await this.signatureRequestRepository.findByToken(token);
    if (!request) {
      throw { status: 404, message: 'Solicitação de assinatura não encontrada' };
    }

    if (request.status === 'ASSINADO') {
      throw { status: 400, message: 'Este contrato já foi assinado' };
    }

    if (request.isExpired()) {
      throw { status: 410, message: 'O link de assinatura expirou' };
    }

    // Como o endpoint é público, buscamos o contrato sem filtrar por empresa autenticada
    // (usando uma query interna do Prisma ou uma alteração na porta se necessário)
    // Para simplificar, o contractRepository.findById exige companyUuid.
    // Vamos adicionar um método findByIdPublic na interface ou usar prisma direto para manter o isolamento controlado.
    // Como a assinatura pública não requer JWT, precisamos obter o contrato sem o cabeçalho de empresa da requisição JWT.
    // Vamos usar a instância do prisma direta ou expandir a interface do ContractRepository para suportar findByIdPublic.
    // Adicionar um método "findByIdPublic(uuid)" na interface ContractRepository é excelente e limpo.
    // Vamos olhar a interface e a implementação do repositório de contratos.
    // E no controller público, passamos apenas o token.
    // Vamos obter do Prisma diretamente no use-case ou adicionar à porta. Adicionar à porta mantém a arquitetura limpa intacta.
    // Deixe-me ver se posso expandir a interface ContractRepository.
    // Sim, vamos adicionar `findByIdPublic(uuid: string): Promise<Contract | null>;` no ContractRepository and no PrismaContractRepository.
    // Vamos escrever o caso de uso assumindo que a porta oferece esse método.
    
    const contract = await this.contractRepository.findByIdWithoutCompany(request.contractUuid);
    if (!contract) {
      throw { status: 404, message: 'Contrato não encontrado' };
    }

    return {
      contract: {
        uuid: contract.uuid!,
        title: contract.title,
        body: contract.body,
        type: contract.type,
        relatedParty: contract.relatedParty,
        relatedPartyEmail: contract.relatedPartyEmail,
        value: contract.value ? Number(contract.value) : null,
      },
      request: {
        uuid: request.uuid!,
        status: request.status,
        expiresAt: request.expiresAt,
        signerName: request.signerName || null,
        signedAt: request.signedAt || null,
      },
    };
  }
}
