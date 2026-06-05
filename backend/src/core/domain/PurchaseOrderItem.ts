export interface PurchaseOrderItemProps {
  uuid?: string;
  createdAt?: Date;
  purchaseOrderUuid?: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice?: number;
}

export class PurchaseOrderItem {
  public readonly uuid?: string;
  public readonly createdAt?: Date;
  public purchaseOrderUuid?: string;
  public description: string;
  public quantity: number;
  public unit: string;
  public unitPrice: number;
  public totalPrice?: number;

  constructor(props: PurchaseOrderItemProps) {
    this.uuid = props.uuid;
    this.createdAt = props.createdAt;
    this.purchaseOrderUuid = props.purchaseOrderUuid;
    this.description = props.description;
    this.quantity = props.quantity;
    this.unit = props.unit;
    this.unitPrice = props.unitPrice;
    this.totalPrice = props.totalPrice;

    this.validate();
  }

  private validate(): void {
    if (!this.description || this.description.trim() === '') throw new Error('Descrição do item é obrigatória');
    if (this.quantity <= 0) throw new Error('Quantidade deve ser maior que zero');
    if (!this.unit || this.unit.trim() === '') throw new Error('Unidade de medida é obrigatória');
    if (this.unitPrice <= 0) throw new Error('Preço unitário deve ser maior que zero');
  }
}
