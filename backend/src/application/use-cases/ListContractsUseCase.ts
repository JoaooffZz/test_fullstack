import { ContractRepository, ListContractsFilter } from '../../core/ports/repositories/ContractRepository';
import { Contract } from '../../core/domain/Contract';

interface ListContractsInput extends ListContractsFilter {
  companyUuid: string;
}

interface ListContractsOutput {
  data: Array<Contract & { daysRemaining: number | null }>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class ListContractsUseCase {
  constructor(private contractRepository: ContractRepository) {}

  async execute(input: ListContractsInput): Promise<ListContractsOutput> {
    const paginated = await this.contractRepository.list(input.companyUuid, {
      status: input.status,
      type: input.type,
      search: input.search,
      page: input.page,
      limit: input.limit,
    });

    const dataWithDays = paginated.data.map((contract) => {
      const daysRemaining = contract.getDaysRemaining();
      return {
        ...contract,
        daysRemaining,
      } as any;
    });

    return {
      data: dataWithDays,
      total: paginated.total,
      page: paginated.page,
      limit: paginated.limit,
      totalPages: paginated.totalPages,
    };
  }
}
