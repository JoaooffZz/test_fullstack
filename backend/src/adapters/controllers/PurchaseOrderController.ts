import { Request, Response } from 'express';
import { CreatePurchaseOrderUseCase } from '../../application/use-cases/CreatePurchaseOrderUseCase';
import { ListPurchaseOrdersUseCase } from '../../application/use-cases/ListPurchaseOrdersUseCase';
import { GetPurchaseOrderUseCase } from '../../application/use-cases/GetPurchaseOrderUseCase';
import { UpdatePurchaseOrderStatusUseCase } from '../../application/use-cases/UpdatePurchaseOrderStatusUseCase';

import { PrismaPurchaseOrderRepository } from '../repositories/PrismaPurchaseOrderRepository';
import { PrismaObraRepository } from '../repositories/PrismaObraRepository';
import { PrismaObraCustoRepository } from '../repositories/PrismaObraCustoRepository';
import { PurchaseOrderStatus } from '../../generated/prisma/client';

const orderRepo = new PrismaPurchaseOrderRepository();
const obraRepo = new PrismaObraRepository();
const custoRepo = new PrismaObraCustoRepository();

const createUseCase = new CreatePurchaseOrderUseCase(orderRepo, obraRepo);
const listUseCase = new ListPurchaseOrdersUseCase(orderRepo);
const getUseCase = new GetPurchaseOrderUseCase(orderRepo);
const updateStatusUseCase = new UpdatePurchaseOrderStatusUseCase(orderRepo, custoRepo);

export class PurchaseOrderController {
  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const companyUuid = req.company!.uuid;
      const createdByUuid = req.user!.uuid;
      const { obra_uuid, supplier_name, supplier_cnpj, payer_cnpj, delivery_date, notes, items } = req.body;

      const formattedItems = (items || []).map((item: any) => ({
        description: item.description,
        quantity: Number(item.quantity),
        unit: item.unit,
        unitPrice: item.unitPrice !== undefined ? Number(item.unitPrice) : Number(item.unit_price),
      }));

      const order = await createUseCase.execute({
        companyUuid,
        createdByUuid,
        obraUuid: obra_uuid,
        supplierName: supplier_name,
        supplierCnpj: supplier_cnpj,
        payerCnpj: payer_cnpj,
        deliveryDate: delivery_date,
        notes,
        items: formattedItems,
      });

      res.status(201).json(order);
    } catch (error: any) {
      res.status(error.status || 500).json({ message: error.message || 'Erro ao criar ordem de compra' });
    }
  };

  list = async (req: Request, res: Response): Promise<void> => {
    try {
      const companyUuid = req.company!.uuid;
      const { status, obra_uuid } = req.query;

      const list = await listUseCase.execute({
        companyUuid,
        status: status as PurchaseOrderStatus,
        obraUuid: obra_uuid as string,
      });

      res.status(200).json(list);
    } catch (error: any) {
      res.status(error.status || 500).json({ message: error.message || 'Erro ao listar ordens de compra' });
    }
  };

  get = async (req: Request, res: Response): Promise<void> => {
    try {
      const companyUuid = req.company!.uuid;
      const uuid = req.params.uuid as string;

      const order = await getUseCase.execute(uuid, companyUuid);
      res.status(200).json(order);
    } catch (error: any) {
      res.status(error.status || 500).json({ message: error.message || 'Erro ao detalhar ordem de compra' });
    }
  };

  updateStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const companyUuid = req.company!.uuid;
      const createdByUuid = req.user!.uuid;
      const userRole = req.user!.role;
      const uuid = req.params.uuid as string;
      const { status } = req.body;

      const updated = await updateStatusUseCase.execute({
        uuid,
        companyUuid,
        userRole,
        createdByUuid,
        status: status as PurchaseOrderStatus,
      });

      res.status(200).json(updated);
    } catch (error: any) {
      res.status(error.status || 500).json({ message: error.message || 'Erro ao atualizar status da ordem de compra' });
    }
  };
}
