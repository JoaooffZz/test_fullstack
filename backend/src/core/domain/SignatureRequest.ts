import { SignatureChannel, SignatureStatus } from '../../generated/prisma/client';

export interface SignatureRequestProps {
  uuid?: string;
  createdAt?: Date;
  updatedAt?: Date;
  contractUuid: string;
  channel: SignatureChannel;
  status?: SignatureStatus;
  token: string;
  expiresAt: Date;
  signedAt?: Date | null;
  signerName?: string | null;
  signerIp?: string | null;
}

export class SignatureRequest {
  public readonly uuid?: string;
  public readonly createdAt?: Date;
  public readonly updatedAt?: Date;
  public readonly contractUuid: string;
  public channel: SignatureChannel;
  public status: SignatureStatus;
  public token: string;
  public expiresAt: Date;
  public signedAt: Date | null;
  public signerName: string | null;
  public signerIp: string | null;

  constructor(props: SignatureRequestProps) {
    this.uuid = props.uuid;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
    this.contractUuid = props.contractUuid;
    this.channel = props.channel;
    this.status = props.status ?? 'ENVIADO';
    this.token = props.token;
    this.expiresAt = props.expiresAt;
    this.signedAt = props.signedAt ?? null;
    this.signerName = props.signerName ?? null;
    this.signerIp = props.signerIp ?? null;

    this.validate();
  }

  private validate(): void {
    if (!this.contractUuid) {
      throw new Error('Vínculo com o contrato é obrigatório');
    }
    if (!this.token || this.token.trim() === '') {
      throw new Error('Token de assinatura é obrigatório');
    }
    if (!this.expiresAt) {
      throw new Error('Data de expiração da assinatura é obrigatória');
    }
  }

  public isExpired(now = new Date()): boolean {
    return now.getTime() > this.expiresAt.getTime();
  }
}
