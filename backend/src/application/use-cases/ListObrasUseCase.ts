import { ObraRepository, ListObrasFilter } from '../../core/ports/repositories/ObraRepository';
import { Obra } from '../../core/domain/Obra';
import { ObraStatus } from '../../generated/prisma/client';

interface ListObrasInput {
  companyUuid: string;
  status?: ObraStatus;
  search?: string;
}

interface ObraWithCostTotal extends Obra {
  costTotal: number;
}

export class ListObrasUseCase {
  constructor(private obraRepository: ObraRepository) {}

  async execute(input: ListObrasInput): Promise<ObraWithCostTotal[]> {
    const obras = await this.obraRepository.list(input.companyUuid, {
      status: input.status,
      search: input.search,
    });

    // Calcular cost_total para cada obra
    const obrasWithCosts = await Promise.all(
      obras.map(async (obra) => {
        const costTotal = await this.obraRepository.sumCosts(obra.uuid!);
        return { ...obra, costTotal } as ObraWithCostTotal;
      }),
    );

    return obrasWithCosts;
  }
}
