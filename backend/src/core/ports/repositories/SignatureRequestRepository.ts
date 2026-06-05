import { SignatureRequest } from '../../domain/SignatureRequest';

export interface SignatureRequestRepository {
  create(request: SignatureRequest): Promise<SignatureRequest>;
  update(request: SignatureRequest): Promise<SignatureRequest>;
  findByToken(token: string): Promise<SignatureRequest | null>;
  findByContract(contractUuid: string): Promise<SignatureRequest[]>;
}
