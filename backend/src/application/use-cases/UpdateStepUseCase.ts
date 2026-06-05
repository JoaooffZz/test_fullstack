import { ObraRepository } from '../../core/ports/repositories/ObraRepository';
import { ObraStepRepository } from '../../core/ports/repositories/ObraStepRepository';
import { ObraStep } from '../../core/domain/ObraStep';
import { ObraPhase, ObraStepStatus } from '../../generated/prisma/client';

interface UpdateStepInput {
  stepUuid: string;
  obraUuid: string;
  companyUuid: string;
  name?: string;
  status: ObraStepStatus;
  sortOrder?: number;
}

export class UpdateStepUseCase {
  constructor(
    private obraRepository: ObraRepository,
    private stepRepository: ObraStepRepository,
  ) {}

  async execute(input: UpdateStepInput): Promise<ObraStep> {
    // Garantir que a obra pertence à empresa
    const obra = await this.obraRepository.findById(input.obraUuid, input.companyUuid);
    if (!obra) throw { status: 404, message: 'Obra não encontrada' };

    const step = await this.stepRepository.findById(input.stepUuid, input.obraUuid);
    if (!step) throw { status: 404, message: 'Etapa não encontrada' };

    if (input.name) step.name = input.name;
    if (input.sortOrder !== undefined) step.sortOrder = input.sortOrder;

    // Aplicar transição de status com completed_at
    if (input.status === 'CONCLUIDA' && step.status !== 'CONCLUIDA') {
      step.complete(); // seta status = CONCLUIDA e completedAt = now
    } else {
      step.status = input.status;
      if (input.status !== 'CONCLUIDA') step.completedAt = null;
    }

    return this.stepRepository.update(step);
  }
}
