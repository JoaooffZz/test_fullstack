import * as jwt from 'jsonwebtoken';
import { TokenService, TokenPayload } from '../../core/ports/services/TokenService';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_change_in_production';
const JWT_EXPIRES_IN = '24h';

export class JwtTokenService implements TokenService {
  generate(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  verify(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
      return decoded;
    } catch {
      throw new Error('Token inválido ou expirado');
    }
  }
}
