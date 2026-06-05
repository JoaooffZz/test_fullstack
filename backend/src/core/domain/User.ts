export type UserRole = 'ADMIN' | 'EDITOR' | 'VIEWER';
export type UserStatus = 'ATIVO' | 'INATIVO';

export interface UserProps {
  uuid?: string;
  createdAt?: Date;
  updatedAt?: Date;
  companyUuid: string;
  name: string;
  email: string;
  passwordHash: string;
  role?: UserRole;
  status?: UserStatus;
}

export class User {
  public readonly uuid?: string;
  public readonly createdAt?: Date;
  public readonly updatedAt?: Date;
  public readonly companyUuid: string;
  public name: string;
  public email: string;
  public passwordHash: string;
  public role: UserRole;
  public status: UserStatus;

  constructor(props: UserProps) {
    this.uuid = props.uuid;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
    this.companyUuid = props.companyUuid;
    this.name = props.name;
    this.email = props.email.toLowerCase().trim();
    this.passwordHash = props.passwordHash;
    this.role = props.role ?? 'EDITOR';
    this.status = props.status ?? 'ATIVO';

    this.validate();
  }

  private validate(): void {
    if (!this.companyUuid) {
      throw new Error('O vínculo com a empresa é obrigatório');
    }
    if (!this.name || this.name.trim() === '') {
      throw new Error('O nome do usuário é obrigatório');
    }
    if (!this.email || !this.email.includes('@')) {
      throw new Error('Formato de e-mail inválido');
    }
    if (!this.passwordHash) {
      throw new Error('O hash da senha é obrigatório');
    }
  }
}
