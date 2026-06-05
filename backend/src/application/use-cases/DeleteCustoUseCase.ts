import { ObraRepository } from '../../core/ports/repositories/ObraRepository';
import { ObraCustoRepository } from '../../core/ports/repositories/ObraCustoRepository';

interface DeleteCustoInput {
  costUuid: string;
  obraUuid: string;
  companyUuid: string;
}

export class DeleteCustoUseCase {
  constructor(
    private obraRepository: ObraRepository,
    private custoRepository: ObraCustoRepository,
  ) {}

  async execute(input: DeleteCustoInput): Promise<void> {
    const obra = await this.obraRepository.findById(input.obraUuid, input.companyUuid);
    if (!obra) throw { status: 404, message: 'Obra não encontrada' };

    await this.custoRepository.delete(input.costUuid, input.obraUuid);
  }
}
