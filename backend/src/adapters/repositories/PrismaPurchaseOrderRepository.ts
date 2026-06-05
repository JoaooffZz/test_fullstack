import { PurchaseOrderRepository, ListPurchaseOrdersFilter } from '../../core/ports/repositories/PurchaseOrderRepository';
import { PurchaseOrder } from '../../core/domain/PurchaseOrder';
import { PurchaseOrderItem } from '../../core/domain/PurchaseOrderItem';
import { prisma } from '../../infrastructure/database/prisma';
import { PurchaseOrderStatus, Prisma } from '../../generated/prisma/client';

export class PrismaPurchaseOrderRepository implements PurchaseOrderRepository {
  private toDomainOrder(record: any): PurchaseOrder {
    return new PurchaseOrder({
      uuid: record.uuid,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      companyUuid: record.companyUuid,
      obraUuid: record.obraUuid,
      createdByUuid: record.createdByUuid,
      number: record.number,
      supplierName: record.supplierName,
      supplierCnpj: record.supplierCnpj,
      payerCnpj: record.payerCnpj,
      deliveryDate: record.deliveryDate,
      status: record.status as PurchaseOrderStatus,
      notes: record.notes,
    });
  }

  private toDomainItem(record: any): PurchaseOrderItem {
    return new PurchaseOrderItem({
      uuid: record.uuid,
      createdAt: record.createdAt,
      purchaseOrderUuid: record.purchaseOrderUuid,
      description: record.description,
      quantity: Number(record.quantity),
      unit: record.unit,
      unitPrice: Number(record.unitPrice),
      totalPrice: Number(record.totalPrice),
    });
  }

  async create(purchaseOrder: PurchaseOrder, items: PurchaseOrderItem[]): Promise<PurchaseOrder> {
    const orderRecord = await prisma.$transaction(async (tx) => {
      const order = await tx.purchaseOrder.create({
        data: {
          companyUuid: purchaseOrder.companyUuid,
          obraUuid: purchaseOrder.obraUuid,
          createdByUuid: purchaseOrder.createdByUuid,
          number: '', // Ativa o trigger trg_purchase_orders_number (rodará sob NEW.number = '')
          supplierName: purchaseOrder.supplierName,
          supplierCnpj: purchaseOrder.supplierCnpj,
          payerCnpj: purchaseOrder.payerCnpj,
          deliveryDate: purchaseOrder.deliveryDate,
          status: purchaseOrder.status,
          notes: purchaseOrder.notes,
        },
      });

      await tx.purchaseOrderItem.createMany({
        data: items.map((item) => ({
          purchaseOrderUuid: order.uuid,
          description: item.description,
          quantity: new Prisma.Decimal(item.quantity),
          unit: item.unit,
          unitPrice: BigInt(item.unitPrice),
        })),
      });

      return order;
    });

    // Buscar a ordem criada novamente para ter o number gerado pelo trigger
    const recordWithNumber = await prisma.purchaseOrder.findUnique({
      where: { uuid: orderRecord.uuid },
    });

    return this.toDomainOrder(recordWithNumber!);
  }

  async updateStatus(uuid: string, status: PurchaseOrderStatus, companyUuid: string): Promise<PurchaseOrder> {
    const record = await prisma.purchaseOrder.update({
      where: { uuid },
      data: { status },
    });
    return this.toDomainOrder(record);
  }

  async findById(uuid: string, companyUuid: string): Promise<PurchaseOrder | null> {
    const record = await prisma.purchaseOrder.findFirst({
      where: { uuid, companyUuid },
    });
    if (!record) return null;
    return this.toDomainOrder(record);
  }

  async findItemsByOrderUuid(orderUuid: string): Promise<PurchaseOrderItem[]> {
    const records = await prisma.purchaseOrderItem.findMany({
      where: { purchaseOrderUuid: orderUuid },
      orderBy: { createdAt: 'asc' },
    });
    return records.map((r) => this.toDomainItem(r));
  }

  async list(companyUuid: string, filter: ListPurchaseOrdersFilter): Promise<(PurchaseOrder & { itemsCount: number; totalValue: number })[]> {
    const where: Prisma.PurchaseOrderWhereInput = {
      companyUuid,
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.obraUuid ? { obraUuid: filter.obraUuid } : {}),
    };

    const records = await prisma.purchaseOrder.findMany({
      where,
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return records.map((r) => {
      const order = this.toDomainOrder(r);
      const itemsCount = r.items.length;
      const totalValue = r.items.reduce((sum, item) => sum + Number(item.totalPrice), 0);

      return Object.assign(order, { itemsCount, totalValue });
    });
  }
}
