import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../context/store';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Building2 } from 'lucide-react';
import { maskCnpj, validateEmail } from '../utils/formatters';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const apiCall = useAuthStore((state) => state.apiCall);

  const [companyName, setCompanyName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCnpj(maskCnpj(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const rawCnpj = cnpj.replace(/\D/g, '');
    if (rawCnpj.length !== 14) {
      setError('CNPJ deve conter exatamente 14 dígitos.');
      return;
    }

    if (!validateEmail(email)) {
      setError('Por favor, insira um e-mail válido.');
      return;
    }

    if (password.length < 8) {
      setError('A senha deve conter pelo menos 8 caracteres.');
      return;
    }

    setLoading(true);
    try {
      await apiCall('/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          companyName,
          cnpj: rawCnpj,
          userName,
          email,
          password,
        }),
      });

      setSuccess('Empresa cadastrada com sucesso! Redirecionando para o login...');
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar cadastro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-[450px] flex flex-col gap-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="text-2xl font-bold tracking-tight text-ink flex items-center gap-1">
            Supabaze<span className="w-2 h-2 rounded-full bg-primary"></span>
          </div>
          <p className="text-sm text-ink-mute">
            Crie sua conta multi-tenant em minutos
          </p>
        </div>

        <Card variant="light" className="w-full">
          <h2 className="text-lg font-bold text-ink mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Cadastre sua empresa
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-accent-tomato/10 border border-accent-tomato/20 rounded-[6px] text-xs font-medium text-accent-tomato">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-[6px] text-xs font-medium text-primary-deep">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="border-b border-hairline pb-2 mb-1">
              <span className="text-xs font-bold text-ink-mute uppercase tracking-wider">Dados da Empresa</span>
            </div>

            <Input
              label="Nome Fantasia / Razão Social"
              placeholder="Minha Empresa S/A"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              disabled={loading}
              required
            />

            <Input
              label="CNPJ"
              placeholder="00.000.000/0000-00"
              value={cnpj}
              onChange={handleCnpjChange}
              disabled={loading}
              required
            />

            <div className="border-b border-hairline pb-2 mt-2 mb-1">
              <span className="text-xs font-bold text-ink-mute uppercase tracking-wider">Conta do Administrador</span>
            </div>

            <Input
              label="Nome Completo"
              placeholder="João Silva"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              disabled={loading}
              required
            />

            <Input
              label="E-mail profissional"
              type="email"
              placeholder="joao@minhaempresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />

            <Input
              label="Senha (mínimo 8 caracteres)"
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
              {loading ? 'Cadastrando...' : 'Concluir cadastro e criar empresa'}
            </Button>
          </form>
        </Card>

        <div className="text-center text-xs text-ink-mute">
          Já possui conta?{' '}
          <Link to="/login" className="text-primary hover:underline font-semibold">
            Fazer login
          </Link>
        </div>
      </div>
    </div>
  );
};
