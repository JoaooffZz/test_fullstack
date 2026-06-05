import { ObraRepository } from '../../core/ports/repositories/ObraRepository';
import { Obra } from '../../core/domain/Obra';
import { ObraStatus } from '../../generated/prisma/client';

interface UpdateObraInput {
  uuid: string;
  companyUuid: string;
  name: string;
  address: string;
  description?: string | null;
  status: ObraStatus;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  budgetTotal?: number | null;
  responsibleCnpj?: string | null;
  contractUuid?: string | null;
}

export class UpdateObraUseCase {
  constructor(private obraRepository: ObraRepository) {}

  async execute(input: UpdateObraInput): Promise<Obra> {
    const obra = await this.obraRepository.findById(input.uuid, input.companyUuid);
    if (!obra) throw { status: 404, message: 'Obra não encontrada' };

    obra.name = input.name;
    obra.address = input.address;
    obra.description = input.description ?? null;
    obra.status = input.status;
    obra.startDate = input.startDate ? new Date(input.startDate) : null;
    obra.endDate = input.endDate ? new Date(input.endDate) : null;
    obra.budgetTotal = input.budgetTotal ?? null;
    obra.responsibleCnpj = input.responsibleCnpj ?? null;
    obra.contractUuid = input.contractUuid ?? null;

    return this.obraRepository.update(obra);
  }
}
