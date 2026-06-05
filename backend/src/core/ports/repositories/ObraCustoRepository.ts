import { ObraCusto } from '../../domain/ObraCusto';

export interface ObraCustoRepository {
  create(custo: ObraCusto): Promise<ObraCusto>;
  delete(uuid: string, obraUuid: string): Promise<void>;
  listByObra(obraUuid: string): Promise<ObraCusto[]>;
}
