import { Request, Response } from 'express';
import { CreateSignatureRequestUseCase } from '../../application/use-cases/CreateSignatureRequestUseCase';
import { ValidateSignatureTokenUseCase } from '../../application/use-cases/ValidateSignatureTokenUseCase';
import { ExecuteSignatureUseCase } from '../../application/use-cases/ExecuteSignatureUseCase';

import { PrismaSignatureRequestRepository } from '../repositories/PrismaSignatureRequestRepository';
import { PrismaContractRepository } from '../repositories/PrismaContractRepository';
import { PrismaAuditRepository } from '../repositories/PrismaAuditRepository';
import { SignatureChannel } from '../../generated/prisma/client';

const signatureRequestRepository = new PrismaSignatureRequestRepository();
const contractRepository = new PrismaContractRepository();
const auditRepository = new PrismaAuditRepository();

const createSignatureUseCase = new CreateSignatureRequestUseCase(contractRepository, signatureRequestRepository);
const validateSignatureTokenUseCase = new ValidateSignatureTokenUseCase(signatureRequestRepository, contractRepository);
const executeSignatureUseCase = new ExecuteSignatureUseCase(signatureRequestRepository, contractRepository, auditRepository);

export class SignatureController {
  requestSignature = async (req: Request, res: Response): Promise<void> => {
    try {
      const companyUuid = req.company!.uuid;
      const { uuid: contractUuid } = req.params as any;
      const { channel, expires_in_days } = req.body;

      if (!channel) {
        res.status(400).json({ message: 'O canal de envio (channel) é obrigatório' });
        return;
      }

      const result = await createSignatureUseCase.execute({
        contractUuid,
        companyUuid,
        channel: channel as SignatureChannel,
        expiresInDays: expires_in_days,
      });

      res.status(200).json(result);
    } catch (error: any) {
      const status = error.status || 500;
      const message = error.message || 'Erro ao processar solicitação de assinatura';
      res.status(status).json({ message });
    }
  };

  validateToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token } = req.params as any;
      const result = await validateSignatureTokenUseCase.execute(token);

      res.status(200).json(result);
    } catch (error: any) {
      const status = error.status || 500;
      const message = error.message || 'Erro ao validar token de assinatura';
      res.status(status).json({ message });
    }
  };

  executeSignature = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token } = req.params as any;
      const { name } = req.body;
      const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

      await executeSignatureUseCase.execute({
        token,
        name,
        ipAddress: ip,
      });

      res.status(200).json({ message: 'Contrato assinado eletronicamente com sucesso' });
    } catch (error: any) {
      const status = error.status || 500;
      const message = error.message || 'Erro ao executar assinatura eletrônica';
      res.status(status).json({ message });
    }
  };
}
