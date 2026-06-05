import { Router } from 'express';
import { ReportController } from '../adapters/controllers/ReportController';
import { requireAuth } from '../adapters/middlewares/requireAuth';

const router = Router();
const controller = new ReportController();

router.use(requireAuth);

router.get('/contracts', controller.contracts);
router.get('/obras', controller.obras);

export { router as reportRoutes };
