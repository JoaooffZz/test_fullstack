import { Contract } from '../../domain/Contract';
import { ContractType, ContractStatus } from '@prisma/client';

export interface ListContractsFilter {
  status?: ContractStatus;
  type?: ContractType;
  search?: string;
  page: number;
  limit: number;
}

export interface PaginatedContracts {
  data: Contract[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ContractRepository {
  create(contract: Contract): Promise<Contract>;
  update(contract: Contract): Promise<Contract>;
  findById(uuid: string, companyUuid: string): Promise<Contract | null>;
  findByIdWithoutCompany(uuid: string): Promise<Contract | null>;
  list(companyUuid: string, filters: ListContractsFilter): Promise<PaginatedContracts>;
}
