import { Router } from 'express';
import { DashboardController } from '../adapters/controllers/DashboardController';
import { requireAuth } from '../adapters/middlewares/requireAuth';

const router = Router();
const controller = new DashboardController();

router.get('/', requireAuth, controller.getMetrics);

export { router as dashboardRoutes };
