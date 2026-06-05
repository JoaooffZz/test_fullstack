import { ContractRepository } from '../../core/ports/repositories/ContractRepository';
import { UploadRepository } from '../../core/ports/repositories/UploadRepository';
import { prisma } from '../../infrastructure/database/prisma';
import { Contract } from '../../core/domain/Contract';

export class GetContractUseCase {
  constructor(
    private contractRepository: ContractRepository,
    private uploadRepository: UploadRepository,
  ) {}

  async execute(uuid: string, companyUuid: string): Promise<any> {
    const contract = await this.contractRepository.findById(uuid, companyUuid);
    if (!contract) {
      throw { status: 404, message: 'Contrato não encontrado' };
    }

    // Buscar uploads anexados
    const uploads = await this.uploadRepository.findByEntity(uuid, 'contract', companyUuid);

    // Buscar histórico de assinaturas
    const signatureRequests = await prisma.signatureRequest.findMany({
      where: { contractUuid: uuid },
      orderBy: { createdAt: 'desc' },
    });

    const daysRemaining = contract.getDaysRemaining();

    return {
      ...contract,
      daysRemaining,
      uploads,
      signatureRequests,
    };
  }
}
