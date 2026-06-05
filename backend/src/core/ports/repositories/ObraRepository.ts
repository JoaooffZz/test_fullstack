import { Obra } from '../../domain/Obra';
import { ObraStatus } from '../../../generated/prisma/client';

export interface ListObrasFilter {
  status?: ObraStatus;
  search?: string;
}

export interface ObraRepository {
  create(obra: Obra): Promise<Obra>;
  update(obra: Obra): Promise<Obra>;
  findById(uuid: string, companyUuid: string): Promise<Obra | null>;
  list(companyUuid: string, filter: ListObrasFilter): Promise<Obra[]>;
  sumCosts(obraUuid: string): Promise<number>;
}
