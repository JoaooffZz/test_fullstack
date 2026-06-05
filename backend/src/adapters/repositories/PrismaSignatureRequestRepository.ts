import { SignatureRequestRepository } from '../../core/ports/repositories/SignatureRequestRepository';
import { SignatureRequest } from '../../core/domain/SignatureRequest';
import { prisma } from '../../infrastructure/database/prisma';
import { SignatureChannel, SignatureStatus } from '../../generated/prisma/client';

export class PrismaSignatureRequestRepository implements SignatureRequestRepository {
  private toDomain(record: {
    uuid: string;
    createdAt: Date;
    updatedAt: Date;
    contractUuid: string;
    channel: SignatureChannel;
    status: SignatureStatus;
    token: string;
    expiresAt: Date;
    signedAt: Date | null;
    signerName: string | null;
    signerIp: string | null;
  }): SignatureRequest {
    return new SignatureRequest({
      uuid: record.uuid,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      contractUuid: record.contractUuid,
      channel: record.channel,
      status: record.status,
      token: record.token,
      expiresAt: record.expiresAt,
      signedAt: record.signedAt,
      signerName: record.signerName,
      signerIp: record.signerIp,
    });
  }

  async create(request: SignatureRequest): Promise<SignatureRequest> {
    const record = await prisma.signatureRequest.create({
      data: {
        contractUuid: request.contractUuid,
        channel: request.channel,
        status: request.status,
        token: request.token,
        expiresAt: request.expiresAt,
      },
    });

    return this.toDomain(record);
  }

  async update(request: SignatureRequest): Promise<SignatureRequest> {
    if (!request.uuid) {
      throw new Error('UUID da solicitação é obrigatório para atualização');
    }

    const record = await prisma.signatureRequest.update({
      where: { uuid: request.uuid },
      data: {
        status: request.status,
        signedAt: request.signedAt,
        signerName: request.signerName,
        signerIp: request.signerIp,
      },
    });

    return this.toDomain(record);
  }

  async findByToken(token: string): Promise<SignatureRequest | null> {
    const record = await prisma.signatureRequest.findUnique({
      where: { token },
    });

    if (!record) return null;
    return this.toDomain(record);
  }

  async findByContract(contractUuid: string): Promise<SignatureRequest[]> {
    const records = await prisma.signatureRequest.findMany({
      where: { contractUuid },
      orderBy: { createdAt: 'desc' },
    });

    return records.map((r) => this.toDomain(r));
  }
}
