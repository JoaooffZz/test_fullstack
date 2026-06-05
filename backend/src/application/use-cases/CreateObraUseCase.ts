import { ObraRepository } from '../../core/ports/repositories/ObraRepository';
import { ObraStepRepository } from '../../core/ports/repositories/ObraStepRepository';
import { ContractRepository } from '../../core/ports/repositories/ContractRepository';
import { Obra } from '../../core/domain/Obra';
import { ObraStep } from '../../core/domain/ObraStep';
import { ObraStatus } from '../../generated/prisma/client';

const DEFAULT_STEPS: Omit<ObraStep, 'uuid' | 'obraUuid' | 'createdAt' | 'updatedAt' | 'completedAt' | 'validate' | 'complete'>[] = [
  { name: 'Orçamento de Custos', phase: 'PLANEJAMENTO', status: 'PENDENTE', sortOrder: 0 },
  { name: 'Projeto Executivo', phase: 'PLANEJAMENTO', status: 'PENDENTE', sortOrder: 1 },
  { name: 'Preparação do Terreno / Fundação', phase: 'EXECUCAO', status: 'PENDENTE', sortOrder: 2 },
  { name: 'Alvenaria e Estrutura', phase: 'EXECUCAO', status: 'PENDENTE', sortOrder: 3 },
  { name: 'Acabamento e Pintura', phase: 'EXECUCAO', status: 'PENDENTE', sortOrder: 4 },
  { name: 'Vistoria Final', phase: 'ENTREGA', status: 'PENDENTE', sortOrder: 5 },
  { name: 'Limpeza', phase: 'ENTREGA', status: 'PENDENTE', sortOrder: 6 },
];

interface CreateObraInput {
  companyUuid: string;
  createdByUuid?: string | null;
  contractUuid?: string | null;
  name: string;
  address: string;
  description?: string | null;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  budgetTotal?: number | null;
  responsibleCnpj?: string | null;
}

export class CreateObraUseCase {
  constructor(
    private obraRepository: ObraRepository,
    private stepRepository: ObraStepRepository,
    private contractRepository: ContractRepository,
  ) {}

  async execute(input: CreateObraInput): Promise<Obra> {
    // Validar vínculo de contrato se informado
    if (input.contractUuid) {
      const contract = await this.contractRepository.findById(input.contractUuid, input.companyUuid);
      if (!contract) {
        throw { status: 404, message: 'Contrato vinculado não encontrado nesta empresa' };
      }
    }

    const obra = new Obra({
      companyUuid: input.companyUuid,
      createdByUuid: input.createdByUuid,
      contractUuid: input.contractUuid,
      name: input.name,
      address: input.address,
      description: input.description,
      startDate: input.startDate ? new Date(input.startDate) : null,
      endDate: input.endDate ? new Date(input.endDate) : null,
      budgetTotal: input.budgetTotal,
      responsibleCnpj: input.responsibleCnpj,
    });

    const created = await this.obraRepository.create(obra);

    // Criar etapas padrão
    const steps = DEFAULT_STEPS.map(
      (s) =>
        new ObraStep({
          obraUuid: created.uuid!,
          name: s.name,
          phase: s.phase,
          status: s.status,
          sortOrder: s.sortOrder,
        }),
    );
    await this.stepRepository.createMany(steps);

    return created;
  }
}
