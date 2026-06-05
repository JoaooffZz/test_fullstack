import { Company } from '../../domain/Company';

export interface CompanyRepository {
  create(company: Company): Promise<Company>;
  findByCnpj(cnpj: string): Promise<Company | null>;
  findById(uuid: string): Promise<Company | null>;
}
