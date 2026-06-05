import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../context/store';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { LogIn } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const loginFn = useAuthStore((state) => state.login);
  const apiCall = useAuthStore((state) => state.apiCall);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }
    
    setLoading(true);
    try {
      const response = await apiCall('/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      
      loginFn(response.token, response.user, response.company);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-[400px] flex flex-col gap-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="text-2xl font-bold tracking-tight text-ink flex items-center gap-1">
            Supabaze<span className="w-2 h-2 rounded-full bg-primary"></span>
          </div>
          <p className="text-sm text-ink-mute">
            Sistema de Controle de Contratos & Gestão Orçamentária
          </p>
        </div>

        <Card variant="light" className="w-full">
          <h2 className="text-lg font-bold text-ink mb-4 flex items-center gap-2">
            <LogIn className="w-5 h-5 text-primary" />
            Acesse sua conta
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-accent-tomato/10 border border-accent-tomato/20 rounded-[6px] text-xs font-medium text-accent-tomato">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="E-mail corporativo"
              type="email"
              placeholder="seuemail@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />

            <Input
              label="Senha"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full py-2.5 mt-2"
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Entrar na plataforma'}
            </Button>
          </form>
        </Card>

        <div className="text-center text-xs text-ink-mute">
          Ainda não tem conta?{' '}
          <Link to="/register" className="text-primary hover:underline font-semibold">
            Cadastre sua empresa
          </Link>
        </div>
      </div>
    </div>
  );
};
