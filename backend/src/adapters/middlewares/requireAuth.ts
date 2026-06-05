import { Request, Response, NextFunction } from 'express';
import { TokenPayload } from '../../core/ports/services/TokenService';
import { JwtTokenService } from '../../infrastructure/providers/JwtTokenService';
import { prisma } from '../../infrastructure/database/prisma';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload['user'];
      company?: TokenPayload['company'];
    }
  }
}

const tokenService = new JwtTokenService();

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
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
    
    // Verify user exists in the database (handles stale JWT sessions after database restarts/resets)
    const dbUser = await prisma.user.findUnique({
      where: { uuid: decoded.user.uuid },
    });

    if (!dbUser) {
      res.status(401).json({ message: 'Usuário não encontrado ou sessão expirada' });
      return;
    }
    
    // Anexa as informações ao request
    req.user = decoded.user;
    req.company = decoded.company;

    next();
  } catch (error: any) {
    res.status(401).json({ message: error.message || 'Token inválido ou expirado' });
  }
}
