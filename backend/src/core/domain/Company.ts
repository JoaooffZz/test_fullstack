export interface CompanyProps {
  uuid?: string;
  createdAt?: Date;
  updatedAt?: Date;
  name: string;
  cnpj: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  isActive?: boolean;
}

export class Company {
  public readonly uuid?: string;
  public readonly createdAt?: Date;
  public readonly updatedAt?: Date;
  public name: string;
  public cnpj: string;
  public email?: string | null;
  public phone?: string | null;
  public address?: string | null;
  public isActive: boolean;

  constructor(props: CompanyProps) {
    this.uuid = props.uuid;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
    this.name = props.name;
    this.cnpj = props.cnpj;
    this.email = props.email;
    this.phone = props.phone;
    this.address = props.address;
    this.isActive = props.isActive ?? true;

    this.validate();
  }

  private validate(): void {
    if (!this.name || this.name.trim() === '') {
      throw new Error('O nome da empresa é obrigatório');
    }
    if (!this.cnpj || this.cnpj.length !== 14) {
      throw new Error('O CNPJ deve ter exatamente 14 dígitos');
    }
  }
}
