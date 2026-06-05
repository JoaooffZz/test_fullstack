export interface TokenPayload {
  user: {
    uuid: string;
    name: string;
    email: string;
    role: string;
  };
  company: {
    uuid: string;
    name: string;
  };
}

export interface TokenService {
  generate(payload: TokenPayload): string;
  verify(token: string): TokenPayload;
}
