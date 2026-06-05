import { Request, Response, NextFunction } from 'express';
import { TokenPayload } from '../../core/ports/services/TokenService';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload['user'];
      company?: TokenPayload['company'];
    }
  }
}

import { JwtTokenService } from '../../infrastructure/providers/JwtTokenService';

const tokenService = new JwtTokenService();

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ message: 'Token de autenticação não fornecido' });
    return;
  }

  const parts = authHeader.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    res.status(401).json({ message: 'Token mal formatado' });
    return;
  }

  const token = parts[1];

  try {
    const decoded = tokenService.verify(token);
    
    // Anexa as informações ao request
    req.user = decoded.user;
    req.company = decoded.company;

    next();
  } catch (error: any) {
    res.status(401).json({ message: error.message || 'Token inválido ou expirado' });
  }
}
