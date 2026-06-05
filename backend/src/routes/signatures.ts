import { Router } from 'express';
import { SignatureController } from '../adapters/controllers/SignatureController';
import { requireAuth } from '../adapters/middlewares/requireAuth';
import { requireRole } from '../adapters/middlewares/requireRole';

const router = Router();
const controller = new SignatureController();

// Rotas públicas (sem autenticação JWT)
router.get('/sign/:token', controller.validateToken);
router.post('/sign/:token', controller.executeSignature);

// Rotas privadas (requerem autenticação)
router.post(
  '/contracts/:uuid/signature-request',
  requireAuth,
  requireRole(['ADMIN', 'EDITOR']),
  controller.requestSignature,
);

export { router as signatureRoutes };
