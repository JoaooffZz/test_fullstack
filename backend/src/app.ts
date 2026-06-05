import express from 'express';
import cors from 'cors';
import path from 'path';
import { authRoutes } from './routes/authRoutes';
import { userRoutes } from './routes/userRoutes';
import { templateRoutes } from './routes/templates';
import { contractRoutes } from './routes/contracts';
import { signatureRoutes } from './routes/signatures';
import { obraRoutes } from './routes/obras';
import { purchaseOrderRoutes } from './routes/purchaseOrders';
import { dashboardRoutes } from './routes/dashboard';
import { reportRoutes } from './routes/reports';

// Global patch to allow JSON serialization of BigInt fields
(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

const app = express();

app.use(cors({
  origin: '*', // Ajuste conforme a necessidade de produção
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));

// Servir a pasta de uploads estaticamente
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Helthcheck endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Rotas da API v1
app.use('/v1/auth', authRoutes);
app.use('/v1/users', userRoutes);
app.use('/v1/contract-templates', templateRoutes);
app.use('/v1/contracts', contractRoutes);
app.use('/v1', signatureRoutes);
app.use('/v1/obras', obraRoutes);
app.use('/v1/purchase-orders', purchaseOrderRoutes);
app.use('/v1/dashboard', dashboardRoutes);
app.use('/v1/reports', reportRoutes);

export { app };
